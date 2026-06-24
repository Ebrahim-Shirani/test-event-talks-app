'''upload_to_drive.py
Google Drive file upload helper

This script uploads a local file to Google Drive using the Drive API.
It expects a 'credentials.json' (OAuth client secret) in the same directory
or uses an existing token file (token.json) for cached credentials.

Prerequisites:
 - Enable the Google Drive API for your project in Google Cloud Console.
 - Install required packages: pip install --upgrade google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client

Usage:
    python upload_to_drive.py <local_path> [<folder_id>]

If <folder_id> is omitted, the file will be uploaded to the root of the drive.
'''\n\nimport os\nimport sys\nimport argparse\nfrom pathlib import Path\n\nfrom google.oauth2.credentials import Credentials\nfrom google_auth_oauthlib.flow import InstalledAppFlow\nfrom google.auth.transport.requests import Request\nfrom googleapiclient.discovery import build\nfrom googleapiclient.http import MediaFileUpload\n\n# If modifying these scopes, delete the token.json file.\nSCOPES = ['https://www.googleapis.com/auth/drive.file']\n\ndef get_credentials():\n    """Load or obtain OAuth2 credentials for Drive API."""\n    creds = None\n    token_path = Path('token.json')\n    if token_path.exists():\n        creds = Credentials.from_authorized_user_file(token_path, SCOPES)\n    # If there are no (valid) credentials, let the user log in.\n    if not creds or not creds.valid:\n        if creds and creds.expired and creds.refresh_token:\n            creds.refresh(Request())\n        else:\n            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)\n            creds = flow.run_local_server(port=0)\n        # Save the credentials for the next run\n        with token_path.open('w') as token_file:\n            token_file.write(creds.to_json())\n    return creds\n\ndef upload_file(service, file_path: Path, folder_id: str = None):\n    """Upload a file to Drive. Returns the file ID."""\n    file_metadata = {'name': file_path.name}\n    if folder_id:\n        file_metadata['parents'] = [folder_id]\n    media = MediaFileUpload(str(file_path), resumable=True)\n    request = service.files().create(body=file_metadata, media_body=media, fields='id')\n    response = request.execute()\n    return response.get('id')\n\ndef main():\n    parser = argparse.ArgumentParser(description='Upload a file to Google Drive')\n    parser.add_argument('file', type=str, help='Path to the local file to upload')\n    parser.add_argument('folder_id', type=str, nargs='?', default=None, help='Optional Drive folder ID')\n    args = parser.parse_args()\n\n    file_path = Path(args.file)\n    if not file_path.is_file():\n        print(f'Error: {file_path} does not exist or is not a file.', file=sys.stderr)\n        sys.exit(1)\n\n    creds = get_credentials()\n    service = build('drive', 'v3', credentials=creds)\n    file_id = upload_file(service, file_path, args.folder_id)\n    print(f'Uploaded {file_path.name} to Drive with ID: {file_id}')\n\nif __name__ == '__main__':\n    main()\n
