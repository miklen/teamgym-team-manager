/// <reference types="google.accounts" />
/// <reference types="google.picker" />
/// <reference types="gapi" />

import { ProbeError } from './candidate';

export const scope = 'https://www.googleapis.com/auth/drive.file';

async function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new ProbeError('Google-script kunne ikke indlæses'));
    document.head.append(script);
  });
}

export async function loadGoogle() {
  await Promise.all([loadScript('https://accounts.google.com/gsi/client'), loadScript('https://apis.google.com/js/api.js')]);
  await new Promise<void>((resolve, reject) => gapi.load('picker', {
    callback: resolve,
    onerror: () => reject(new ProbeError('Google Picker kunne ikke indlæses')),
    timeout: 10000,
    ontimeout: () => reject(new ProbeError('Google Picker svarede ikke')),
  }));
}

export function tokenClient(clientId: string, onToken: (token: string, expiresIn: number) => void, onError: () => void) {
  return google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope,
    include_granted_scopes: true,
    callback: (response) => {
      if (response.error || !response.access_token || !google.accounts.oauth2.hasGrantedAllScopes(response, scope)) {
        onError();
        return;
      }
      onToken(response.access_token, Number(response.expires_in));
    },
    error_callback: onError,
  });
}

export function pick(token: string, projectNumber: string, apiKey: string, folder: boolean): Promise<string | null> {
  return new Promise((resolve) => {
    const view = new google.picker.DocsView(folder ? google.picker.ViewId.FOLDERS : google.picker.ViewId.DOCS)
      .setIncludeFolders(folder)
      .setSelectFolderEnabled(folder);
    if (!folder) view.setMimeTypes('application/json');
    new google.picker.PickerBuilder()
      .setAppId(projectNumber)
      .setDeveloperKey(apiKey)
      .setOAuthToken(token)
      .setOrigin(location.origin)
      .setLocale('da')
      .addView(view)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED) resolve(data.docs?.[0]?.id ?? null);
        if (data.action === google.picker.Action.CANCEL) resolve(null);
      })
      .build()
      .setVisible(true);
  });
}
