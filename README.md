# GRiv Jogos

Portal de jogos online com visual nostálgico, focado em clássicos Flash (via [Ruffle](https://ruffle.rs/)) e jogos HTML5. Inclui painel administrativo, contas de usuário, favoritos, histórico e suporte ao emulador **Social Empires**.

## Tecnologias

- [Next.js 15](https://nextjs.org/) (App Router)
- [React 19](https://react.dev/)
- [Prisma](https://www.prisma.io/) + SQLite
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Ruffle](https://ruffle.rs/) (emulador Flash no navegador)

## Requisitos

- Node.js 20+
- npm
- Windows (para o emulador Social Empires via `.exe`)

## Instalação

```bash
# Clonar o repositório e entrar na pasta
cd "C:\GRiv Jogos"

# Instalar dependências
npm install

# Configurar variável de ambiente (crie o arquivo .env na raiz)
# DATABASE_URL="file:./prisma/dev.db"

# Aplicar migrações do banco
npx prisma migrate deploy
npx prisma generate
```

Na primeira execução, acesse `GET /api/auth/setup` para criar o administrador padrão e as categorias iniciais (somente se ainda não houver admin cadastrado).

## Executar em desenvolvimento

```bash
npm run dev
```

O site abre em [http://localhost:3000](http://localhost:3000).

### Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento na porta **3000** |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia o servidor de produção na porta **3000** |
| `npm run lint` | Executa o ESLint |
| `npm run social-emperors` | Inicia o emulador Social Empires na porta **5050** |

## Estrutura do projeto

```
GRiv Jogos/
├── prisma/              # Schema e migrações SQLite
├── public/uploads/      # Ícones e arquivos SWF enviados pelo admin
├── scripts/             # Scripts auxiliares (emulador, seed)
├── services/
│   └── social-emperors/ # Bundle do emulador (~1,3 GB, não versionado)
├── src/app/
│   ├── admin/           # Painel administrativo
│   ├── api/             # Rotas da API REST
│   ├── jogo/[slug]/     # Página de cada jogo
│   ├── login/           # Login de usuários
│   ├── social-emperors/ # Proxy reverso para o emulador
│   └── page.tsx         # Página inicial
└── ...
```

## Tipos de jogo

| Tipo | Como funciona |
|------|----------------|
| **SWF** | Um arquivo `.swf` é servido em `public/uploads/swfs/` e reproduzido com Ruffle na página do jogo. |
| **HTML5** | URL externa ou interna carregada em um `<iframe>` na página do jogo. |

### Cadastrar jogos

1. Acesse `/admin` e faça login como administrador.
2. Preencha título, descrição, categoria e ícone.
3. Para **SWF**: envie o arquivo `.swf` ou informe um caminho em `public/`.
4. Para **HTML5**: informe a URL do jogo (`gameUrl`).

## Social Empires

O Social Empires **não** é um SWF simples: é um emulador Python/Flask empacotado que precisa de um servidor próprio na porta **5050**.

### Configuração

1. Coloque o pacote `social-emperors_0.04a` em:

   ```
   services/social-emperors/
     social-emperors_0.04a.exe
     bundle/
     saves/
   ```

2. Em **dois terminais**, execute:

   ```bash
   npm run social-emperors   # terminal 1 — emulador
   npm run dev               # terminal 2 — site
   ```

3. Acesse o jogo em `/jogo/social-empires`.

### Como funciona a integração

O site usa um **proxy** em `/social-emperors` que encaminha as requisições para `http://127.0.0.1:5050`, reescrevendo URLs e cookies para funcionar no mesmo domínio (`localhost:3000`). Isso evita problemas de CORS e de cookies em iframes.

Na tela de login do emulador:

- Selecione sua vila
- Escolha a versão **0.9.26b (Working)**
- Clique em **Log in**

### Cadastrar no banco (opcional)

Se o jogo ainda não existir no banco:

```bash
node scripts/seed-social-emperors.mjs
```

### Produção

O Social Empires exige um **servidor sempre ativo** (VPS). Não é compatível com hospedagem serverless (ex.: Vercel) sem um backend separado para o emulador.

## Funcionalidades do site

- **Home** — listagem de jogos por categoria, busca e ordenação
- **Página do jogo** — player SWF (Ruffle) ou iframe HTML5, favoritos e tela cheia
- **Usuários** — registro, login, favoritos e histórico de jogos (`/login`)
- **Admin** — CRUD de jogos e categorias, upload de arquivos, reordenação por arrastar

## API principal

| Rota | Métodos | Descrição |
|------|---------|-----------|
| `/api/games` | GET, POST | Listar e criar jogos |
| `/api/games/[id]` | GET, PUT, DELETE | Detalhe, edição e remoção |
| `/api/games/[id]/view` | POST | Incrementar visualizações |
| `/api/games/reorder` | POST | Reordenar jogos na home |
| `/api/categories` | GET, POST | Categorias |
| `/api/auth/login` | POST | Login do administrador |
| `/api/auth/user/*` | — | Login, registro e sessão de usuários |
| `/api/user/favorites` | GET, POST | Favoritos |
| `/api/user/history` | GET, POST | Histórico de jogos |

## Licença

Projeto privado. O emulador Social Empires é um projeto de preservação de terceiros ([AcidCaos/socialemperors](https://github.com/AcidCaos/socialemperors)), licenciado sob GPL-3.0.
