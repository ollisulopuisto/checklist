# Journo AI-koulutus: Webinaarin tarkistuslista

Tämä on yksinkertainen ja helppokäyttöinen selainsovellus webinaarin osallistujille. Sen avulla osallistujat voivat seurata omaa oppimistaan, reflektoida webinaarin antia ja antaa palautetta järjestäjälle.

👉 **[Kokeile sovellusta tästä!](https://ollisulopuisto.github.io/checklist/)**

## Miten sovellus toimii?

1. **Kirjautuminen:** Käyttäjä syöttää nimensä aloittaakseen.
2. **Tarkistuslista:** Käyttäjä käy läpi oppimistavoitteet ja merkitsee ne asiat, jotka hän kokee oppineensa. Edistymispalkki näyttää visuaalisesti, kuinka suuri osa tavoitteista on saavutettu.
3. **Palaute:** Käyttäjä voi kirjoittaa vapaamuotoista palautetta webinaarista.
4. **Raportointi:** Lopuksi käyttäjä voi kopioida yhteenvedon oppimisestaan ja palautteestaan leikepöydälle tai avata sen suoraan sähköpostiohjelmaansa lähettämistä varten.

### Ominaisuudet
* **Tietosuoja:** Sovellus toimii täysin selaimessa. Mitään tietoja ei lähetetä ulkopuolisille palvelimille, vaan kaikki tallentuu ainoastaan käyttäjän oman selaimen paikalliseen muistiin (`localStorage`).
* **Automaattinen tallennus:** Edistyminen tallentuu selaimeen, joten sivun voi päivittää tai sulkea menettämättä tietoja.
* **Responsiivinen:** Toimii saumattomasti niin puhelimella kuin tietokoneellakin.

## Tekniset tiedot

Tämä projekti on luotu modernilla web-teknologiapinolla:
* **React** (Käyttöliittymäkirjasto)
* **Vite** (Nopea kehitystyökalu ja kääntäjä)
* **Tailwind CSS** (Tyylittely)
* **Lucide React** (Ikonit)
* **Framer Motion** (Animaatiot)

Sovellus on julkaistu automaattisesti **GitHub Pages** -palveluun hyödyntäen GitHub Actions -työnkulkua.
