fetch("/api/health")
  .then((r) => r.json())
  .then((h) => { document.getElementById("status").textContent = `${h.status} (v${h.version})`; })
  .catch(() => { document.getElementById("status").textContent = "unavailable"; });
