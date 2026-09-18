import os
import uvicorn

def main():
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Darukaa.Earth AI Environmental Scientist Backend on port {port}...")
    uvicorn.run("backend.src.api.main:app", host="0.0.0.0", port=port, reload=False)

if __name__ == "__main__":
    main()
