export function isContextValid(): boolean {
  try {
    if (
      typeof chrome === 'undefined' || 
      typeof chrome.runtime === 'undefined' || 
      !chrome.runtime.id ||
      typeof chrome.i18n === 'undefined'
    ) {
      return false;
    }
    chrome.i18n.getMessage('extensionName');
    return true;
  } catch (e) {
    return false;
  }
}

export function getParentHostname(): string {
  try {
    return window.parent.location.hostname;
  } catch (e) {
    return '';
  }
}

export function checkParentDOM(selector: string): boolean {
  try {
    if (window.parent !== window && window.parent.document) {
      return !!window.parent.document.querySelector(selector);
    }
  } catch (e) {}
  return false;
}

export function isWebmailSite(): boolean {
  const host = window.location.hostname || getParentHostname();
  if (
    /mail\./.test(host) || 
    /outlook\./.test(host) || 
    /zoho\./.test(host) || 
    /ymail\./.test(host) || 
    /proton\./.test(host) || 
    /roundcube/.test(host) || 
    /zimbra/.test(host)
  ) {
    return true;
  }
  const commonWebmailSelectors = [
    '.a3s',
    '.rps_code',
    '.zmMailContent', '.zmContent', '.zmContentMain', '.zmcContent',
    '.message-body-container',
    '.email-wrapped', '.message_body', '.msg-body',
    '#messagebody',
    '.v-Message-body'
  ].join(', ');
  if (document.querySelector(commonWebmailSelectors) || checkParentDOM(commonWebmailSelectors)) {
    return true;
  }
  return false;
}
