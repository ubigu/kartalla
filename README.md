# Kartalla

## Ohjelmiston taustaa

Kuntien suunnittelussa on keskeistä, että suunnittelua tehdään jatkuvassa vuorovaikutuksessa kuntalaisten kanssa. Vuorovaikutus kuntalaisten kanssa toteutetaan osallistamisella sekä palautteen keräämisellä. Usein kuntalaisten tarpeet ja näkemykset ovat paikkaan sidottuja, jolloin karttakyselypalvelu tulee mukaan kysymykseen. Tarkoituksena on siis toteuttaa vuorovaikutteinen karttakyselypalvelu kuntalaisten osallistamiseksi Tampereen kaupungin kehittämiseen.

## Ohjelmiston komponentit

Ohjelmiston pääkomponentteina toimivat käyttöliittymä, serveri sekä tietokanta. Käyttöliittymässä on käytetty Tampereen Oskari -karttaupotusta. Ohjelmiston ajoympäristönä toimii Microsoft Azure -pilvipalvelu. Pääkomponenttien dokumentaatiot löytyvät kunkin alakansion alta: <code> server, client, db</code>.

Kuva 1: ohjelmiston arkkitehtuuri ajoympäristössään
![Arkkitehtuuri](vv_arkkitehtuuri.jpg)

## Ohjeet sovelluskehitykseen

### Lyhyt ohjeistus:

- Käynnistä Docker -ekosysteemi projektin juuresssa komennoilla `docker-compose build && docker-compose up -d`. Esiehto: lokaalisti tulee olla asennettuna [Docker -konttien hallintajärjestelmä](https://www.docker.com/products/docker-desktop)).
- Luo ympäristömuuttujille tiedosto polkuun `/server/.env` ja täytä se tarvittavilla muuttujilla ohjeen `/server/.template.env` mukaan.
- Toteuta uudet toiminnallisuudet omaan Git -haaraansa, esim. `feature/new-feature-name`. Valmistuessaan yhdistä tämä haara pull requestin kautta suoraan `main` -haaraan. CI/CD ajaa testit automaattisesti ja julkaisee hyväksytyn koodin testiympäristöön. Tuotantopäivitys tehdään luomalla release.

<br>

### Pidempi ohjeistus:

Sovelluksen kehitys tapahtuu [Docker](https://docs.docker.com/) -ekosysteemin avulla. Kehitystä varten ohjelmistokehittäjällä on oltava lokaalisti omalla koneellaan asennettuna Docker -kontteja hallinnoiva sovellus, esimerkiksi [Docker Desktop](https://www.docker.com/products/docker-desktop). Docker -kontteja voidaan ohjata komentoriviltä lähdekoodin juuripolusta, jossa Docker -kontteja hallinnoiva konfiguraatiotiedosto _docker-compose.yml_ sijaitsee. Aluksi sovelluksen käyttämät kirjastot ja muut riippuvuudet asennetaan suorittamalla komento `docker-compose build`. Tämän jälkeen Docker -kontit käynnistetään komennolla `docker-compose up -d`. Komento käynnistää kolme eri palvelua: serverin, käyttöliittymän sekä tietokannan. Kullekin näistä luodaan oma docker kontti, joiden nimet ovat vastaavasti `server`, `client` sekä `db`. Serveri käynnistyy lokaalisti osoitteeseen `localhost:3000`, käyttöliittymä osoitteeseen `localhost:8080` sekä tietokanta osoitteeseen `localhost:5432`. Toisinaan konttien käynnistyksessä voi ilmetä virhetilanteita. Yksittäisen kontin lokitietoihin pääsee käsiksi esimerkiksi ajamalla komennon `docker-compose logs -f <kontin-nimi>`, esimerkkinä `docker-compose logs -f server`. Mikäli kontti ei käynnisty tai ilmenee tarve käynnistää kontti uudelleen virhetilanteesta johtuen, voidaan tämä suorittaa komennolla `docker-compose restart <kontin-nimi>`.

Serveri ja tietokanta juttelevat keskenään yhteydellä, joka on määritetty ympäristömuuttujien (environment variables) avulla. Nämä tulee olla määritettyinä serverin juuressa polussa `/server/.env`. Lähdekoodissa on valmiiksi tiedosto, jossa on määritetty kukin tarvittava ympäristömuuttuja: `/server/.template.env`. Kehittäjä voi luoda tästä tiedostosta kopion, nimetä sen `.env`:ksi, ja täyttää tiedostoon tarvittavat ympäristömuuttujat.

Lokaalissa kehityksessä React käyttöliittymä ohjaa rajapintapyynnöt automaattisesti omaan porttiinsa. Toisin sanoen, mikäli käyttöliittymästä (portti 8080) tehdään HTTP pyyntö serverille (portti 3000), tätä ei tarvitse erikseen määrittää, vaan käyttöliittymä osaa ohjata liikenteen suoraan omasta portistaan serverin porttiin (8080 -> 3000).

Sovelluskehitys noudattaa trunk-pohjaista kehitysmallia. Uudet toiminnallisuudet toteutetaan omaan lyhytikäiseen Git -haaraansa, esim. `feature/new-feature-name`, ja yhdistetään pull requestin kautta suoraan `main` -haaraan. Kun `main` -haaraan kohdistuu muutoksia Githubissa, automaattinen CI/CD-integraatio käynnistyy: ensin ajetaan testit, ja niiden läpäisyn jälkeen uusi lähdekoodi julkaistaan Azuren testiympäristöön. Tuotantopäivitys tehdään luomalla uusi release, jonka julkaiseminen käynnistää automaattisen viennin Azuren tuotantoympäristöön.

## Storybook – komponenttien kehitys ja testaus

Ydinkäyttöliittymäkomponenttien (`client/src/components/core`) kehitystä ja visuaalista testausta varten on käytettävissä [Storybook](https://storybook.js.org/). Storybook käynnistetään `client`-kansiosta:

```bash
npm run storybook   # Käynnistää Storybookin osoitteeseen localhost:6006
```

Storyt sijaitsevat polulla `client/src/components/core/stories/`. Kukin komponentti saa oman `.stories.tsx`-tiedostonsa. Storybook sisältää myös saavutettavuustarkistuksen (`@storybook/addon-a11y`), joka raportoi WCAG-rikkomukset suoraan selaimessa.

Tuotantoversio Storybookista voidaan rakentaa komennolla:

```bash
npm run build-storybook
```

## E2E-testaus

E2E testit ajetaan automaattisesti jokaisen pull requestin yhteydessä.

E2E-testiympäristö on toteutettu vastaavalla tavalla, kuin paikallinen kehitysympäristö sillä erolla, että E2E-testiympäristö käynnistetään `e2e`-kansiosta käsin. Testit ajetaan `Playwright`-kirjastoa käyttäen. Tietokannan sisältö tallennetaan erilliseen `db-data`-volumeen, joten E2E-testien ajaminen ei vaikuta kehitystietokannan sisältöön.

Testiympäristön käynnistämisen jälkeen seuraavat komennot ovat käytettävissä `./e2e`-polusta:

- `npm run codegen`: Avaa selainnäkymän, josta käsin pystyy luomaan testikomentoja interaktiivisesti
- `npm run test-ui`: Ajaa testit selainnäkymässä
- `npm test`: Ajaa testit headless-tilassa näyttäen vain tulosteen komentorivillä
