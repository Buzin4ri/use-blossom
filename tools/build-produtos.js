/* =========================================================
   USE BLOSSOM — Monta o catálogo do site
   ---------------------------------------------------------
   O painel /admin salva UMA FICHA POR PRODUTO dentro da pasta
   "produtos/". Este script junta todas essas fichas em um único
   arquivo "products.json", que é o arquivo que o site lê.

   Ele roda sozinho na Netlify a cada publicação (veja netlify.toml).

   REGRA DE SEGURANÇA: este script NUNCA derruba o deploy.
   Se algo der errado, ele avisa no log e mantém o products.json
   anterior, para o site continuar no ar exatamente como estava.
   ========================================================= */

var fs = require("fs");
var path = require("path");

var RAIZ = path.join(__dirname, "..");
var PASTA_PRODUTOS = path.join(RAIZ, "produtos");
var SAIDA = path.join(RAIZ, "products.json");

function log(msg) {
  console.log("[catalogo] " + msg);
}

function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function paraBooleano(valor, padrao) {
  if (valor === true || valor === false) return valor;
  if (valor === "true") return true;
  if (valor === "false") return false;
  return padrao;
}

function paraNumero(valor, padrao) {
  var n = parseInt(valor, 10);
  return isNaN(n) ? padrao : n;
}

function main() {
  if (!fs.existsSync(PASTA_PRODUTOS)) {
    log('Pasta "produtos/" não encontrada. Mantendo o products.json atual.');
    return;
  }

  var arquivos = fs.readdirSync(PASTA_PRODUTOS).filter(function (nome) {
    return /\.json$/i.test(nome);
  });

  var produtos = [];
  var ignorados = 0;

  arquivos.forEach(function (arquivo) {
    var caminho = path.join(PASTA_PRODUTOS, arquivo);
    var ficha;
    try {
      ficha = JSON.parse(fs.readFileSync(caminho, "utf8"));
    } catch (erro) {
      ignorados++;
      log('AVISO: não consegui ler "' + arquivo + '" (' + erro.message + "). Produto ignorado.");
      return;
    }

    var nome = texto(ficha.nome);
    var preco = texto(ficha.preco);

    if (!nome || !preco) {
      ignorados++;
      log('AVISO: "' + arquivo + '" está sem nome ou sem preço. Produto ignorado.');
      return;
    }

    produtos.push({
      nome: nome,
      categoria: texto(ficha.categoria) || "outros",
      preco: preco,
      precoPromocional: texto(ficha.precoPromocional),
      descricao: texto(ficha.descricao),
      imagem: texto(ficha.imagem),
      disponivel: paraBooleano(ficha.disponivel, true),
      destaque: paraBooleano(ficha.destaque, false),
      ordem: paraNumero(ficha.ordem, 100),
    });
  });

  if (produtos.length === 0) {
    log("Nenhum produto válido encontrado. Mantendo o products.json atual para não esvaziar o site.");
    return;
  }

  // Ordem da vitrine: menor número primeiro; empate resolvido pelo nome.
  produtos.sort(function (a, b) {
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  var conteudo = JSON.stringify({ produtos: produtos }, null, 2) + "\n";
  fs.writeFileSync(SAIDA, conteudo, "utf8");

  var disponiveis = produtos.filter(function (p) { return p.disponivel; }).length;
  var destaques = produtos.filter(function (p) { return p.destaque; }).length;
  log(
    produtos.length + " produto(s) no catálogo · " +
    disponiveis + " disponível(is) · " +
    (produtos.length - disponiveis) + " esgotado(s) · " +
    destaques + " em destaque" +
    (ignorados ? " · " + ignorados + " ficha(s) ignorada(s)" : "")
  );
}

try {
  main();
} catch (erro) {
  // Nunca falhar o build: o site continua com o catálogo anterior.
  log("AVISO: erro inesperado (" + erro.message + "). O site segue com o catálogo anterior.");
}
