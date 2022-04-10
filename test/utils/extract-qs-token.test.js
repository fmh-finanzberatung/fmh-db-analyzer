const tape = require('tape');
const log = require('mk-log');
const extractQsToken = require('../../lib/utils/extract-qs-token.js');

tape((t) =>{ 
  const token = 'df726794-b5b3-11ec-a627-3c07544b9a5d'; 
  const s = `Hallo, Sie haben sich mit der E-Mail-Adresse
    test@galt.de
    für das Test Site-Konto registriert. Bitte bestätigen Sie die
    Registrierung unter dieser E-Mail-Adresse, indem Sie auf den folgenden
    Link klicken:
    http://localhost?token=${token} assafas
    asf as as fdas f`;
  const extractedToken = extractQsToken(s);
  
  t.equal(extractedToken, token, 'extracted token');
  t.end();
});
