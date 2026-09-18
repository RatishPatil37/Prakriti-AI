import uvicorn

def main():
    print("Starting Darukaa.Earth AI Environmental Scientist Backend...")
    uvicorn.run("backend.src.api.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
