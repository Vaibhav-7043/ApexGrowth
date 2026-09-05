import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get('/api/health')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'ok'
    assert data['database'] == 'healthy'
    assert 'razorpay_mode' in data

@pytest.mark.asyncio
async def test_merchant_endpoint(client: AsyncClient):
    response = await client.get('/api/merchants/current')
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'Artisan Roasters Co.'
    assert data['currency'] == 'INR'

@pytest.mark.asyncio
async def test_customers_endpoint(client: AsyncClient):
    response = await client.get('/api/customers?limit=10')
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10
    
    # Filter by segment
    resp_segment = await client.get('/api/customers?segment=at_risk_high_value')
    assert resp_segment.status_code == 200
    seg_data = resp_segment.json()
    assert len(seg_data) == 42
    assert all(c['rfm_segment'] == 'at_risk_high_value' for c in seg_data)

@pytest.mark.asyncio
async def test_analytics_overview_endpoint(client: AsyncClient):
    response = await client.get('/api/analytics/overview')
    assert response.status_code == 200
    data = response.json()
    assert data['total_revenue_30d'] > 0
    assert data['total_customers'] == 220
    assert data['currency'] == 'INR'
    assert len(data['segments']) > 0

@pytest.mark.asyncio
async def test_audit_endpoints(client: AsyncClient):
    # Fetch events
    resp_events = await client.get('/api/audit/events')
    assert resp_events.status_code == 200
    events = resp_events.json()
    assert len(events) >= 2
    
    # Verify chain
    resp_verify = await client.get('/api/audit/verify')
    assert resp_verify.status_code == 200
    verify_data = resp_verify.json()
    assert verify_data['is_valid'] is True
    assert verify_data['total_events'] >= 2

@pytest.mark.asyncio
async def test_agent_approval_and_campaign_execution_api_flow(client: AsyncClient):
    # 1. Fetch current opportunity
    opp_res = await client.get('/api/opportunities/current')
    assert opp_res.status_code == 200
    opp_data = opp_res.json()
    assert opp_data['target_segment'] == 'at_risk_high_value'
    
    # 2. Agent proposes strategy
    prop_res = await client.post(
        '/api/agent/propose-strategy',
        json={'opportunity_id': opp_data['id'], 'custom_discount_override': 12.0}
    )
    assert prop_res.status_code == 200
    prop_data = prop_res.json()
    assert prop_data['strategy']['proposed_discount_percent'] == 12.0
    assert prop_data['approval_request']['status'] == 'pending_approval'
    
    # 3. Merchant decides approval
    app_id = prop_data['approval_request']['id']
    dec_res = await client.post(
        f'/api/approvals/{app_id}/decide',
        json={'approved': True, 'decided_by': 'merchant_lead'}
    )
    assert dec_res.status_code == 200
    assert dec_res.json()['status'] == 'approved'
    
    # 4. Execute Campaign
    exec_res = await client.post(
        '/api/campaigns/execute',
        json={'approval_request_id': app_id, 'idempotency_key': 'api_exec_test_1'}
    )
    assert exec_res.status_code == 200
    camp_data = exec_res.json()
    camp_id = camp_data['id']
    assert camp_data['target_count'] == 42
    assert camp_data['status'] == 'running'
    
    # 5. Fetch Campaign Actions
    actions_res = await client.get(f'/api/campaigns/{camp_id}/actions?limit=5')
    assert actions_res.status_code == 200
    actions = actions_res.json()
    assert len(actions) == 5
    action_to_simulate = actions[0]
    
    # 6. Simulate Payment via Sandbox Endpoint
    sim_res = await client.post(
        '/api/sandbox/payments/simulate',
        json={'action_id': action_to_simulate['id'], 'event_type': 'SUCCESS', 'payment_method': 'upi'}
    )
    assert sim_res.status_code == 200
    assert sim_res.json()['status'] == 'success'
    assert sim_res.json()['attributed_revenue'] == action_to_simulate['final_amount']
    
    # 7. Fetch Campaign Metrics (Projected vs Actual)
    metrics_res = await client.get(f'/api/campaigns/{camp_id}/metrics')
    assert metrics_res.status_code == 200
    metrics = metrics_res.json()
    assert metrics['conversions_count'] == 1
    assert metrics['actual_gross_revenue'] == action_to_simulate['final_amount']
    assert metrics['projected_gross_revenue'] > 0

@pytest.mark.asyncio
async def test_policy_config_api(client: AsyncClient):
    get_res = await client.get('/api/policies/current')
    assert get_res.status_code == 200
    assert get_res.json()['max_discount_percent'] == 20.0
    
    put_res = await client.put(
        '/api/policies/current',
        json={
            'max_discount_percent': 18.0,
            'max_campaign_audience': 400,
            'max_budget_inr': 45000.0,
            'cooldown_days_per_customer': 21,
            'require_manual_approval_above_inr': 4000.0
        }
    )
    assert put_res.status_code == 200
    assert put_res.json()['max_discount_percent'] == 18.0
