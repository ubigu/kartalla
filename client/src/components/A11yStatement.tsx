import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export function A11yStatement() {
  const { search } = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(search), [search]);
  const surveyLanguage =
    (queryParams.get('lang') as 'fi' | 'se' | 'en') || 'fi';

  const translations = {
    fi: {
      title: 'Saavutettavuusseloste',
      description:
        'Tämä saavutettavuusseloste koskee Ubigu Oy:n tarjoamaa Kartalla -sovellusta.',
      currentStatus: 'Palvelun saavutettavuuden nykytila',
      currentStatusDescription:
        'Palvelu täyttää kansainvälisen WCAG 2.1 saavutettavuussäädöksen tason AA-vaatimukset osittain. Palvelussa on pieniä puutteita saavutettavuuteen liittyen, jotka on kuvattu alla.',
      issuesTitle: 'Puutteet saavutettavuudessa',
      issues: [
        'Responsiivisuusongelmia: Palvelun käyttöliittymät ja toiminnallisuudet eivät toimi eri päätelaitteilla ja tuetuilla selaimilla kriteeristön asettamissa rajoissa. Erityisesti karttapohjaisissa kysymyksissä on runsaasti responsiivisuuteen liittyviä ongelmia. (WCAG 1.4.10 Responsiivisuus)',
        'Heikkoja kontrasteja: Palvelussa saattaa olla heikkoja kontrasteja kuvissa ja kartoissa, joita hyödynnetään kyselyissä. (WCAG 1.4.3 Kontrasti, minimi, 1.4.11 Ei-tekstimuotoisen sisällön kontrasti)',
        'Liian pieni kosketusalue: Mobiiliversiossa interaktiivisten elementtien kosketusalueet ovat liian pienet ja vaikeuttavat palvelun käyttämistä. (WCAG 3.2.1 Kohdistaminen)',
      ],
      outsideLawTitle: 'Lainsäädännön ulkopuoliset puutteet',
      outsideLawIssues: [
        'Kartat, joita ei ole tarkoitettu navigointikäyttöön (esimerkiksi sää- tai maastokartat)',
      ],
    },
    en: {
      title: 'Accessibility Statement',
      description:
        'This accessibility statement applies to the Kartalla application provided by Ubigu Oy.',
      currentStatus: 'Current state of service accessibility',
      currentStatusDescription:
        'The service partially meets the AA-level requirements of the international WCAG 2.1 accessibility standard. There are minor accessibility issues in the service, which are described below.',
      issuesTitle: 'Accessibility issues',
      issues: [
        'Responsiveness issues: The service interfaces and functionalities do not work within the criteria on different devices and supported browsers. Especially in map-based questions, there are many responsiveness-related issues. (WCAG 1.4.10 Responsiveness)',
        'Weak contrasts: The service may have weak contrasts in images and maps used in surveys. (WCAG 1.4.3 Contrast, minimum, 1.4.11 Non-text contrast)',
        'Too small touch area: In the mobile version, the touch areas of interactive elements are too small, making it difficult to use the service. (WCAG 3.2.1 Target size)',
      ],
      outsideLawTitle: 'Issues outside the scope of legislation',
      outsideLawIssues: [
        'Maps not intended for navigation purposes (e.g., weather or terrain maps)',
      ],
    },
    se: {
      title: 'Tillgänglighetsutlåtande',
      description:
        'Detta tillgänglighetsutlåtande gäller Kartalla-applikationen som tillhandahålls av Ubigu Oy.',
      currentStatus: 'Nuvarande tillgänglighetsstatus för tjänsten',
      currentStatusDescription:
        'Tjänsten uppfyller delvis AA-nivåkraven i den internationella WCAG 2.1-tillgänglighetsstandarden. Det finns mindre tillgänglighetsproblem i tjänsten som beskrivs nedan.',
      issuesTitle: 'Tillgänglighetsproblem',
      issues: [
        'Responsivitetsproblem: Tjänstens gränssnitt och funktioner fungerar inte inom kriterierna på olika enheter och stödda webbläsare. Särskilt i kartbaserade frågor finns det många problem relaterade till responsivitet. (WCAG 1.4.10 Responsivitet)',
        'Svaga kontraster: Tjänsten kan ha svaga kontraster i bilder och kartor som används i enkäter. (WCAG 1.4.3 Kontrast, minimum, 1.4.11 Icke-textkontrast)',
        'För liten beröringsyta: I mobilversionen är beröringsytorna för interaktiva element för små, vilket gör det svårt att använda tjänsten. (WCAG 3.2.1 Målstorlek)',
      ],
      outsideLawTitle: 'Problem utanför lagstiftningens omfattning',
      outsideLawIssues: [
        'Kartor som inte är avsedda för navigeringsändamål (t.ex. väder- eller terrängkartor)',
      ],
    },
  };

  const t = translations[surveyLanguage] ?? translations.fi;

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
      <h1>{t.title}</h1>
      <p>{t.description}</p>
      <h2>{t.currentStatus}</h2>
      <p>{t.currentStatusDescription}</p>
      <h3>{t.issuesTitle}</h3>
      <ul>
        {t.issues.map((issue, index) => (
          <li key={index}>
            <p>{issue}</p>
          </li>
        ))}
      </ul>
      <h3>{t.outsideLawTitle}</h3>
      <ul>
        {t.outsideLawIssues.map((issue, index) => (
          <li key={index}>
            <p>{issue}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
