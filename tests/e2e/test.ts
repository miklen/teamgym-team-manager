import { test as base, expect } from '@playwright/test';

interface GoogleMock {
  failLoads: number;
  failFirstAuthorization: boolean;
}
export const test = base.extend<{ googleMock: GoogleMock }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright kræver destructuring af fixture-afhængigheder.
  googleMock: async ({}, use) => {
    await use({ failLoads: 0, failFirstAuthorization: false });
  },
  page: async ({ page, context, googleMock }, use) => {
    await context.route('https://accounts.google.com/gsi/client', async (route) => {
      if (googleMock.failLoads > 0) {
        googleMock.failLoads--;
        await route.abort('failed');
        return;
      }
      await route.fulfill({
        contentType: 'application/javascript',
        body: `
        let attempts = 0;
        window.google = { accounts: { oauth2: {
          initTokenClient: (configuration) => ({ requestAccessToken: (options) => {
            attempts++; window.syntheticTokenOptions = options;
            if (${googleMock.failFirstAuthorization} && attempts === 1) configuration.error_callback({type:'popup_closed'});
            else configuration.callback({access_token:'synthetic-renewed-access',expires_in:'3600',scope:'https://www.googleapis.com/auth/drive.file'});
          }}), hasGrantedAllScopes: () => true, revoke: (_, done) => done()
        }}};`,
      });
    });
    await context.route('https://apis.google.com/js/api.js', (route) =>
      route.fulfill({
        contentType: 'application/javascript',
        body: `
      window.gapi = { load: (_, options) => {
        class DocsView { constructor(id) { this.folder = id === 'folders'; } setIncludeFolders(){return this;} setSelectFolderEnabled(){return this;} setMimeTypes(){return this;} }
        class PickerBuilder {
          setAppId(){return this;} setDeveloperKey(){return this;} setOAuthToken(){return this;} setOrigin(){return this;} setLocale(){return this;}
          addView(view){this.folder=view.folder; return this;} setCallback(callback){this.callback=callback; return this;}
          build(){
            const wrapper = document.createElement('div'); wrapper.style.cssText='position:fixed;inset:0;z-index:200000;background:#ffffffee;display:grid;place-items:center';
            const frame = document.createElement('iframe'); frame.title='Google Drive'; frame.src='https://docs.google.com/picker?synthetic=true'; frame.style.cssText='width:min(600px,95vw);height:400px;border:1px solid'; wrapper.append(frame);
            const handler = (event) => { if(event.source !== frame.contentWindow || event.data.source !== 'synthetic-picker') return;
              this.callback(event.data.action === 'cancel' ? {action:'cancel'} : {action:'picked', docs:[{id:this.folder?'synthetic-folder':'synthetic-file'}]});
            };
            return {setVisible:()=>{document.body.append(wrapper);window.addEventListener('message',handler);},dispose:()=>{wrapper.remove();window.removeEventListener('message',handler);}};
          }
        }
        window.google.picker={DocsView,PickerBuilder,ViewId:{FOLDERS:'folders',DOCS:'docs'},Action:{PICKED:'picked',CANCEL:'cancel'}}; options.callback();
      }};`,
      }),
    );
    await context.route('https://docs.google.com/picker?synthetic=true', (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html lang="da"><head><title>Google Drive</title></head><body><h1>Cookiepræferencer</h1><button id="cookies">Accepter kun nødvendige</button><div id="files" hidden><h1>Vælg mappe</h1><button id="select">Vælg</button><button id="cancel">Annuller</button></div><script>document.getElementById('cookies').onclick=()=>{document.getElementById('cookies').hidden=true;document.getElementById('files').hidden=false;};for(const [id,action] of [['select','picked'],['cancel','cancel']])document.getElementById(id).onclick=()=>parent.postMessage({source:'synthetic-picker',action},'*');</script></body></html>`,
      }),
    );
    await use(page);
  },
});
export { expect };
