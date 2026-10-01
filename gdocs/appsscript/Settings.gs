/**
 * Verbatim — settings & profile
 *
 * Stored in Document Properties under the "Verbatim" namespace, mirroring
 * the Word .dotm registry pattern.  Defaults match the upstream template.
 */

function getSettings() {
  return loadSettings_();
}

function setSettings(json) {
  const props = PropertiesService.getDocumentProperties();
  Object.keys(json).forEach(k => {
    props.setProperty('Verbatim.' + k, String(json[k]));
  });
  return loadSettings_();
}

function loadSettings_() {
  const props = PropertiesService.getDocumentProperties();
  return {
    usePilcrows: props.getProperty('Verbatim.usePilcrows') !== 'false', // default true
    paragraphIntegrity: props.getProperty('Verbatim.paragraphIntegrity') !== 'false', // default true
    shrinkOmissions: props.getProperty('Verbatim.shrinkOmissions') === 'true', // default false
    underlineBold: props.getProperty('Verbatim.underlineBold') === 'true', // default false
    highlightColor: props.getProperty('Verbatim.highlightColor') || '#ffff00',
    profile: loadProfile_(),
  };
}

function loadProfile_() {
  const props = PropertiesService.getUserProperties();
  return {
    name: props.getProperty('Verbatim.user.name') || '',
    school: props.getProperty('Verbatim.user.school') || '',
  };
}

function saveProfile_(name, school) {
  const props = PropertiesService.getUserProperties();
  if (name !== undefined) props.setProperty('Verbatim.user.name', name);
  if (school !== undefined) props.setProperty('Verbatim.user.school', school);
  return loadProfile_();
}