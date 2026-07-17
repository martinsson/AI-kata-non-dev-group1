/* Stockage local partagé + génération du .docx — Demandes de bon de commande.
   Tout est conservé dans le navigateur (localStorage) : aucune base de données
   serveur pour l'instant. Les données restent donc sur ce poste/navigateur. */
(function () {
  "use strict";

  var K_SUP = "bc_suppliers";   // table des fournisseurs
  var K_REQ = "bc_requests";    // historique des demandes
  var TEMPLATE_URL = "modele-bon-de-commande.docx";

  var CENTRE_COUT = "67012_OZER";                 // valeur fixe (remarque 1)
  var CENTRES_FINANCIERS = [                       // valeurs autorisées (remarque 2)
    "67012_SENS", "67012_ACCO", "67012_TRAN", "67012_FONC"
  ];

  function load(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid(p) { return (p || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function todayFR() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear();
  }

  // Date longue en français, ex. "17 juillet 2026" (format d'origine du document).
  var MOIS_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  function todayLongFR() {
    var d = new Date();
    return d.getDate() + " " + MOIS_FR[d.getMonth()] + " " + d.getFullYear();
  }

  /* ---------------- Fournisseurs ---------------- */
  function suppliers() { return load(K_SUP); }
  function saveSuppliers(a) { save(K_SUP, a); }
  function supplierById(id) { return suppliers().filter(function (s) { return s.id === id; })[0] || null; }
  function supplierByNum(num) {
    num = (num || "").trim();
    return suppliers().filter(function (s) { return s.num === num; })[0] || null;
  }
  function supplierByName(nom) {
    nom = (nom || "").trim().toLowerCase();
    return suppliers().filter(function (s) { return (s.nom || "").trim().toLowerCase() === nom; })[0] || null;
  }
  // Ajoute un fournisseur ; le numéro est permanent une fois créé.
  function addSupplier(data) {
    var a = suppliers();
    var s = {
      id: uid("f"),
      num: (data.num || "").trim(),
      nom: (data.nom || "").trim(),
      adresse: (data.adresse || "").trim(),
      email: (data.email || "").trim(),
      telephone: (data.telephone || "").trim()
    };
    a.push(s); saveSuppliers(a); return s;
  }
  // Met à jour les coordonnées SANS jamais changer le numéro (lien permanent).
  function updateSupplier(id, patch) {
    var a = suppliers();
    for (var i = 0; i < a.length; i++) {
      if (a[i].id === id) {
        var num = a[i].num;                 // numéro figé
        ["nom", "adresse", "email", "telephone"].forEach(function (k) {
          if (patch[k] != null) a[i][k] = String(patch[k]).trim();
        });
        a[i].num = num;
        saveSuppliers(a); return a[i];
      }
    }
    return null;
  }
  function deleteSupplier(id) { saveSuppliers(suppliers().filter(function (s) { return s.id !== id; })); }

  /* ---------------- Demandes (historique) ---------------- */
  function requests() { return load(K_REQ); }
  function saveRequests(a) { save(K_REQ, a); }
  function addRequest(data) {
    var a = requests();
    var r = JSON.parse(JSON.stringify(data));
    r.id = uid("r");
    r.created = new Date().toISOString();
    a.unshift(r);                            // plus récent en premier
    saveRequests(a);
    return r;
  }
  function deleteRequest(id) { saveRequests(requests().filter(function (r) { return r.id !== id; })); }

  function ttcTotal(data) {
    return (data.articles || []).reduce(function (sum, art) {
      var v = parseFloat(String(art.ttc || "").replace(/\s/g, "").replace(",", "."));
      return sum + (isFinite(v) ? v : 0);
    }, 0);
  }

  /* ---------------- Génération du .docx ---------------- */
  function slug(s) { return (s || "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40); }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // Renvoie une Promise ; nécessite PizZip + docxtemplater chargés sur la page.
  function generateDocx(data) {
    return fetch(TEMPLATE_URL)
      .then(function (r) { if (!r.ok) throw new Error("Modèle introuvable (" + r.status + ")"); return r.arrayBuffer(); })
      .then(function (buf) {
        var doc = new window.docxtemplater(new window.PizZip(buf), { paragraphLoop: true, linebreaks: true });
        doc.render(data);
        var out = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        });
        downloadBlob(out, "Bon_de_commande_" + (slug(data.fournisseur) || "sans_nom") + ".docx");
        return true;
      });
  }

  window.BCStore = {
    CENTRE_COUT: CENTRE_COUT,
    CENTRES_FINANCIERS: CENTRES_FINANCIERS,
    todayFR: todayFR,
    todayLongFR: todayLongFR,
    // fournisseurs
    suppliers: suppliers, supplierById: supplierById, supplierByNum: supplierByNum,
    supplierByName: supplierByName, addSupplier: addSupplier, updateSupplier: updateSupplier,
    deleteSupplier: deleteSupplier,
    // demandes
    requests: requests, addRequest: addRequest, deleteRequest: deleteRequest, ttcTotal: ttcTotal,
    // docx
    generateDocx: generateDocx
  };
})();
