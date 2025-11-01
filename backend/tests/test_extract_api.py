from datetime import datetime, timezone

from backend.app.models import JobRunStatus


def test_job_lifecycle(client, in_memory_queue, notification_bus):
    create_payload = {
        "name": "Daily product scrape",
        "description": "Scrape product listings",
        "target_urls": ["https://example.com/products"],
        "selectors": {"title": "h1", "price": ".price"},
        "scripts": {"wait_for": "#products"},
        "schedule_cron": "0 6 * * *",
        "export_formats": ["csv", "json"],
        "status": "active",
    }

    create_resp = client.post("/extract/jobs", json=create_payload)
    assert create_resp.status_code == 201, create_resp.text
    job = create_resp.json()
    job_id = job["id"]

    list_resp = client.get("/extract/jobs")
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] == 1

    trigger_resp = client.post(f"/extract/jobs/{job_id}/run")
    assert trigger_resp.status_code == 200
    run_payload = trigger_resp.json()["run"]
    run_id = run_payload["id"]

    assert len(in_memory_queue.messages) == 1
    queued_message = in_memory_queue.messages[0]
    assert queued_message["job_id"] == job_id
    assert queued_message["job_run_id"] == run_id

    callback_payload = {
        "run_id": run_id,
        "status": JobRunStatus.succeeded.value,
        "progress": 100,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "metadata": {"records": 120},
        "artifacts": [
            {
                "export_format": "csv",
                "storage_path": f"jobs/{job_id}/runs/{run_id}/export.csv",
            }
        ],
    }

    callback_resp = client.post("/extract/hooks/worker-callback", json=callback_payload)
    assert callback_resp.status_code == 200, callback_resp.text

    detail_resp = client.get(f"/extract/jobs/{job_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == job_id
    assert detail["runs"]
    assert detail["runs"][0]["status"] == JobRunStatus.succeeded.value

    exports_resp = client.get(f"/extract/jobs/{job_id}/exports")
    assert exports_resp.status_code == 200
    exports = exports_resp.json()
    assert len(exports) == 1
    assert exports[0]["export_format"] == "csv"
    assert exports[0]["signed_url"].startswith("https://supabase.local/storage")

    events = notification_bus.published_events
    assert events
    latest_event = events[-1]
    assert latest_event["run_id"] == run_id
    assert latest_event["status"] == JobRunStatus.succeeded.value
