import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function DataProtectionStatement() {
  const { search } = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const surveyLanguage =
    (queryParams.get('lang') as 'fi' | 'se' | 'en') || 'fi';

  const translations = {
    fi: {
      title: 'Tietosuoja- ja tiedonhallintaseloste',
      intro:
        'Tämä tietosuoja- ja tiedonhallintaseloste koskee Ubigu Oy:n tarjoamaa Kartalla -sovellusta.',
      sections: [
        {
          heading: '1. Rekisterinpitäjä',
          content: 'Ubigu Oy',
        },
        {
          heading: '2. Henkilötiedot',
          content:
            'Web-sovellus ei kerää käyttäjien henkilötietoja automaattisesti. Henkilötietoja pyydetään ja käsitellään vain käyttäjän antaessa ne erikseen luvan esimerkiksi yhteydenottolomakkeen kautta. Tällöin kerättävät tiedot voivat sisältää nimen, sähköpostiosoitteen ja viestin sisällön.',
        },
        {
          heading: '3. Tietojen käyttötarkoitus',
          content:
            'Kerätyt henkilötiedot käytetään ainoastaan käyttäjän yhteydenottopyynnön käsittelyyn. Tietoja ei käytetä markkinointiin eikä jaeta kolmansille osapuolille.',
        },
        {
          heading: '4. Tietojen säilytys ja suojaus',
          content:
            'Henkilötietoja säilytetään vain niin kauan kuin on tarpeen yhteydenottopyynnön käsittelyyn. Tietoja suojataan asianmukaisesti teknisin ja organisatorisin toimenpitein.',
        },
        {
          heading: '5. Käyttäjän oikeudet',
          content:
            'Käyttäjällä on oikeus tarkastaa häntä koskevat henkilötiedot, pyytää niiden oikaisua tai poistoa sekä vastustaa tietojen käsittelyä. Pyynnöt tulee lähettää web-sovelluksen ylläpitäjälle.',
        },
        {
          heading: '6. Muutokset tietosuojaselosteeseen',
          content:
            'Web-sovelluksen ylläpitäjä pidättää oikeuden tehdä muutoksia tähän tietosuojaselosteeseen. Muutoksista ilmoitetaan web-sovelluksen sivuilla.',
        },
      ],
    },
    en: {
      title: 'Data Protection and Information Management Statement',
      intro:
        'This data protection and information management statement applies to the Kartalla application provided by Ubigu Oy.',
      sections: [
        {
          heading: '1. Data Controller',
          content: 'Ubigu Oy',
        },
        {
          heading: '2. Personal Data',
          content:
            'The web application does not automatically collect personal data from users. Personal data is requested and processed only when the user explicitly provides it, for example, through a contact form. The collected data may include name, email address, and the content of the message.',
        },
        {
          heading: '3. Purpose of Data Use',
          content:
            "The collected personal data is used solely for processing the user's contact request. The data is not used for marketing or shared with third parties.",
        },
        {
          heading: '4. Data Retention and Protection',
          content:
            'Personal data is retained only as long as necessary to process the contact request. The data is protected with appropriate technical and organizational measures.',
        },
        {
          heading: '5. User Rights',
          content:
            'The user has the right to review their personal data, request corrections or deletion, and object to data processing. Requests should be sent to the web application administrator.',
        },
        {
          heading: '6. Changes to the Data Protection Statement',
          content:
            "The web application administrator reserves the right to make changes to this data protection statement. Changes will be announced on the web application's pages.",
        },
      ],
    },
    se: {
      title: 'Dataskydds- och informationshanteringsbeskrivning',
      intro:
        'Denna dataskydds- och informationshanteringsbeskrivning gäller för Kartalla-applikationen som tillhandahålls av Ubigu Oy.',
      sections: [
        {
          heading: '1. Registeransvarig',
          content: 'Ubigu Oy',
        },
        {
          heading: '2. Personuppgifter',
          content:
            'Webbapplikationen samlar inte automatiskt in personuppgifter från användare. Personuppgifter begärs och behandlas endast när användaren uttryckligen tillhandahåller dem, till exempel via ett kontaktformulär. De insamlade uppgifterna kan inkludera namn, e-postadress och meddelandets innehåll.',
        },
        {
          heading: '3. Syfte med användning av uppgifter',
          content:
            'De insamlade personuppgifterna används enbart för att behandla användarens kontaktförfrågan. Uppgifterna används inte för marknadsföring eller delas med tredje part.',
        },
        {
          heading: '4. Lagring och skydd av uppgifter',
          content:
            'Personuppgifter lagras endast så länge det är nödvändigt för att behandla kontaktförfrågan. Uppgifterna skyddas med lämpliga tekniska och organisatoriska åtgärder.',
        },
        {
          heading: '5. Användarens rättigheter',
          content:
            'Användaren har rätt att granska sina personuppgifter, begära rättelse eller radering av dem samt invända mot behandlingen av uppgifterna. Förfrågningar ska skickas till webbapplikationens administratör.',
        },
        {
          heading: '6. Ändringar i dataskyddsbeskrivningen',
          content:
            'Webbapplikationens administratör förbehåller sig rätten att göra ändringar i denna dataskyddsbeskrivning. Ändringar meddelas på webbapplikationens sidor.',
        },
      ],
    },
  };

  const content = translations[surveyLanguage] ?? translations.fi;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignContent: 'center',
        justifyContent: 'center',
        width: '60%',
        margin: '36px',
      }}
    >
      <h1>{content.title}</h1>
      <p>{content.intro}</p>
      {content.sections.map((section, index) => (
        <div key={index}>
          <h2>{section.heading}</h2>
          <p>{section.content}</p>
        </div>
      ))}
    </div>
  );
}
