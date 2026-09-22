# 🌸 Como publicar o site da Use Blossom (grátis) e liberar o painel para a cliente

O site fica hospedado de graça no **Netlify**, e sua cliente edita os produtos,
fotos e preços por um **painel** (`seusite.com/admin`) — sem mexer em código.

Você só precisa fazer esta configuração **uma vez**. Depois é tudo no painel.

---

## Visão geral (o caminho)

1. Colocar os arquivos do site no **GitHub** (guarda os arquivos).
2. Conectar o **Netlify** ao GitHub (publica o site no ar).
3. Ligar o **login** (Netlify Identity) e o **Git Gateway**.
4. **Convidar a cliente** por e-mail para o painel.

Tudo isso é feito pelo navegador, com cliques. Não precisa instalar nada.

---

## PARTE 1 — Subir os arquivos no GitHub

1. Crie uma conta grátis em https://github.com  (se já tiver, faça login).
2. Clique no **+** (canto superior direito) → **New repository**.
3. Em **Repository name** escreva: `use-blossom`
4. Deixe como **Public** (ou Private, tanto faz) e clique **Create repository**.
5. Na tela do repositório, clique no link **"uploading an existing file"**
   (ou aba **Add file → Upload files**).
6. **Arraste TODOS os arquivos e a pasta `images` e a pasta `admin`** desta pasta
   do projeto para a área de upload. (Pode arrastar a pasta inteira.)
   - Importante: suba também `index.html`, `styles.css`, `script.js`,
     `products.json`, `settings.json`, a pasta `admin/` e a pasta `images/`.
7. Clique em **Commit changes**.

✅ Pronto, seus arquivos estão no GitHub.

---

## PARTE 2 — Publicar no Netlify

1. Crie uma conta grátis em https://www.netlify.com  → **Sign up with GitHub**
   (assim já conecta com o GitHub).
2. No painel do Netlify clique em **Add new site → Import an existing project**.
3. Escolha **GitHub** e autorize.
4. Selecione o repositório **use-blossom**.
5. Não precisa preencher "build command". Deixe em branco e clique **Deploy**.
6. Em alguns segundos o site fica no ar num endereço tipo
   `https://nome-aleatorio.netlify.app`.

> 💡 Quer um nome melhor? Em **Site configuration → Change site name**
> você troca para algo como `useblossom.netlify.app`.
> (Para usar um domínio próprio, ex: `useblossom.com.br`, dá pra comprar
>  e conectar depois em **Domain management**.)

---

## PARTE 3 — Ligar o login do painel (Identity + Git Gateway)

1. No Netlify, abra seu site → **Site configuration** (ou **Settings**).
2. No menu, procure **Identity** → clique **Enable Identity**.
3. Ainda em Identity → **Registration**: mude para **Invite only**
   (assim só quem você convidar entra no painel).
4. Em Identity → **Services → Git Gateway** → clique **Enable Git Gateway**.

---

## PARTE 4 — Convidar a cliente (e você mesmo)

1. Vá em **Identity** → aba **Invite users**.
2. Digite o **e-mail da sua cliente** (e o seu também, se quiser testar) → **Send**.
3. Ela vai receber um e-mail "You've been invited..." → clica no link →
   **cria uma senha**.
4. Pronto! A partir daí ela acessa **`seusite.com/admin`**, faz login com
   e-mail e senha, e edita tudo.

---

## ✨ Como a cliente usa o painel (explique pra ela)

Endereço: **`https://SEU-SITE.netlify.app/admin`**

Lá dentro ela vê duas seções:

- **🛍️ Produtos** → adicionar/editar/remover produtos.
  Em cada produto ela muda **nome, preço, descrição**, faz **upload da foto**
  (botão de imagem) e o **selo** (Novidade, Mais vendido…).
- **⚙️ Contato da loja** → trocar o **WhatsApp** e o **Instagram**.

Depois de editar, ela clica em **Publish** (Publicar). Em ~1 minuto o site
no ar já mostra a alteração, sozinho. 🎉

---

## ⚠️ Observações importantes

- O preço deve ser digitado **só com números e vírgula** (ex: `89,90`).
  O "R$" o site coloca sozinho.
- O WhatsApp deve ter **país + DDD + número, só dígitos** (ex: `5511969095915`).
- As fotos enviadas pelo painel vão automaticamente para a pasta `images/`.
- Toda alteração feita no painel é salva no GitHub e republicada no Netlify
  automaticamente — você não precisa fazer nada manualmente.

---

## Precisa de ajuda?
Se algum passo travar, me chame que eu te ajudo a resolver. 💛
