
const datobj = new Date();
const currentyear = datobj.getFullYear();

export const fileobjs = [{
    text: "Guv",
    links: {
        file: "guv.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=guv`,
            name: "GUV Tabelle",
            icon: "table"
        }]
    }
},
{
    text: "Konzernbilanz",
    links: {
        file: "konzernbilanz.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=konzernbilanz/aktiva`,
            name: "Konzernbilanz Aktiva",
            icon: "table"
        }, {
            urlobj: `/display?year=${currentyear}&table=konzernbilanz/passiva`,
            name: "Konzernbilanz Passiva",
            icon: "table"
        }]
    }
},
{
    text: "Eigenkapitalspiegel",
    links: {
        file: "eigenkapitalspiegel.xlsx",
        representations: [
            {
                urlobj: `/display?year=${currentyear}&table=eigenkapitalspiegel/I`,
                name: "Eigenkapitalspiegel Tabelle I",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=eigenkapitalspiegel/II`,
                name: "Eigenkapitalspiegel Tabelle II",
                icon: "table"
            }
        ]
    }
},
{
    text: "Kapitalfluss",
    links: {
        file: "kapitalfluss.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=kapitalfluss`,
            name: "Kapitalfluss Tabelle",
            icon: "table"
        }]
    }
},
{
    text: "Anlagengitter",
    links: {
        file: "anlagengitter.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=anlagengitter/I`,
            name: "Anlagengitter Tabelle I",
            icon: "table"
        },
        {
            urlobj: `/display?year=${currentyear}&table=anlagengitter/II`,
            name: "Anlagengitter Tabelle II",
            icon: "table"
        }    
    ]
    }
},
{
    text: "Rueckstellung",
    links: {
        file: "rueckstellung.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=rueckstellung`,
            name: "Rueckstellungs Tabelle",
            icon: "table"
        }]
    }
},
{
    text: "Verbindlichkeiten",
    links: {
        file: "verbindlichkeiten.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=verbindlichkeiten`,
            name: "Verbindlichkeiten Tabelle",
            icon: "table"
        }]
    }
},
{
    text: "Lagebericht",
    links: {
        file: "lagebericht.xlsx",
        representations: [
            {
                urlobj: `/display?year=${currentyear}&table=lagebericht/bestand`,
                name: "Bestandsmanagement",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=lagebericht/neubau`,
                name: "Neubau",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=lagebericht/ertragslage`,
                name: "Ertragslage",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=lagebericht/finanzlage`,
                name: "Finanzlage",
                icon: "table"
            },
        ]
    }
},
{
    text: "Anhang",
    links: {
        file: "anhang.xlsx",
        representations: [
            {
                urlobj: `/display?year=${currentyear}&table=anhang/umsatzerloes/hausbewirtschaftung`,
                name: "Umsatzerlöse Hausbewirtschaftung",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=anhang/umsatzerloes/betreuungstaetigkeit`,
                name: "Umsatzerlöse Betreuungstätigkeit",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=anhang/umsatzerloes/lieferungenundleistungen`,
                name: "Umsatzerlöse Lieferungen und Leistungen",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=anhang/sonstige/betrieblicheertraege`,
                name: "Sonstige betriebliche Erträge",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=anhang/sonstige/betrieblicheaufwendungen`,
                name: "Sonstige betriebliche Aufwendungen",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=anhang/sonstige/mitarbeiterinnen`,
                name: "Mitarbeiter/-innen",
                icon: "table"
            },
            {
                urlobj: `/display?year=${currentyear}&table=anhang/sonstige/altersversorgung`,
                name: "Zusätzliche Altersversorgung",
                icon: "table"
            },
        ]
    }
},
{
    text: "Kennzahlen",
    links: {
        file: "kennzahlen.xlsx",
        representations: [{
            urlobj: `/display?year=${currentyear}&table=kennzahlen`,
            name: "Kennzahlen Tabelle",
            icon: "table"
        }]
    }
},
]