# Flores e Presentes Paixão — Contexto do projeto

> **Para o Claude:** este arquivo resume o projeto inteiro. Leia antes de propor mudanças.
> Ao terminar cada alteração, atualize o "Histórico" e entregue este arquivo junto.
>
> Última atualização: 07/10/2026

## O que é

Sistema da **Flores e Presentes Paixão**, floricultura em Uberlândia/MG. Duas partes:

- **App de gestão** (com login): pedidos com entrega agendada, produtos, clientes e relatórios.
- **Catálogo público** (sem login): o cliente monta o orçamento e manda o pedido pelo WhatsApp.

Quarto projeto do Miguel Borges, depois de Move Elegance, Fran Acessórios, Caroline
Acessórios e Udiflex.

## Dados da loja

- **Endereço:** R. Ângelo Cunha, 342 — São Jorge, Uberlândia/MG
- **WhatsApp:** (34) 99217-9322 → `5534992179322`
- **Instagram:** @florespresentespaixao
- **Horário:** segunda a sábado, das 8h às 18h. Domingo fechado.
- **Login da dona:** `floresepresentespaixao@gmail.com`, perfil admin, nome "Floricultura Paixão"

## Onde fica cada coisa

- **Código:** GitHub `FloresePresentesPaixao/Flores-e-Presentes-Paix-o`, branch `main` (conta dela)
- **Hospedagem:** Cloudflare Workers, projeto `flores-e-presentes-paix-o` (conta dela)
- **App:** https://flores-e-presentes-paix-o.floresepresentespaixao26.workers.dev
- **Catálogo:** o mesmo endereço com `/catalogo` no fim
- **Supabase:** projeto `qojpijbimbwdxuwjvypf`, bucket de fotos **`paixao`**

## Tecnologia

React + Vite + `@supabase/supabase-js`, estilos inline, fontes Playfair Display e Inter.
`wrangler.toml` publica a pasta `dist` como página única. **Não existe `public/_redirects`**
— os dois juntos dão erro de laço infinito no deploy.

**Paleta:** creme `#FDF7F4`, vinho `#8E1B2E`, rosa `#C2415A`, tinta `#3A2A2E`, linha `#EDE0DA`.

## Arquivos do repositório

`index.html` (21) · `package.json` (16) · `vite.config.js` (4) · `wrangler.toml` (7) ·
`public/manifest.json` (25) · `src/config.js` (6) · `src/main.jsx` (9) · `src/api.js` (365) ·
`src/App.jsx` (2292) · `src/Catalog.jsx` (867)

`main.jsx`: se o endereço tem "catalogo", abre o Catálogo; senão, o App.

## Banco (Supabase)

Script rodado: `paixao_schema.sql`.

Tabelas: `profiles`, `categories`, `occasions` (ocasiões), `delivery_zones` (bairro + taxa),
`customers`, `order_status` (etapas editáveis), `settings`, `products`, `product_images`,
`product_sizes` (P/M/G com preços), `product_occasions`, `orders`, `order_items`,
`order_history`. Função `next_order_number()`.

**O que o pedido guarda de diferente de uma loja comum:** quem compra e quem recebe são
pessoas diferentes; endereço com bairro ligado à taxa; data e faixa de horário; marcação
de urgente; e os três campos do cartão (mensagem, de, para).

Produtos aceitam: preço fechado, "a partir de", **sob consulta** (com valor de referência
opcional, que vira "Sob consulta — a partir de R$ ..."), tamanhos P/M/G com preços
diferentes, controle de estoque opcional (para pelúcias e canecas) e ocasiões.

**Promoção** fica em `promo_price`, campo separado: o preço de tabela nunca é sobrescrito, e
encerrar a promoção é apagar esse campo. Vale só para produto de preço único — sem tamanhos
e sem "sob consulta". O catálogo e os pedidos lançados no app usam o preço promocional
enquanto ele estiver no ar; o pedido guarda o valor cobrado, então promoção encerrada não
mexe em pedido antigo.

`show_quote` liga ou desliga o botão "Consultar valores" de cada produto no catálogo.
`settings.pix_type` guarda o tipo da chave Pix (CNPJ, CPF, Celular, E-mail, Aleatória).

## App — o que existe

- **Hoje:** agenda de entregas do dia, atrasados, o que sai amanhã, vendas do mês e a receber.
- **Pedidos:** filtros, busca, cadastro em 5 passos (quem compra, itens, entrega, cartão,
  valores). O bairro traz a taxa sozinho; cliente novo entra no cadastro automaticamente.
  A ficha muda etapa, marca pago, abre o endereço no mapa, avisa pelo WhatsApp e cancela.
- **Promoções:** aba própria. Escolhe o produto, põe o valor, e ele aparece com o preço
  riscado no catálogo. A lista "No ar agora" mostra o desconto e tem o botão de tirar, que
  devolve o preço cadastrado. Também dá para pôr e tirar pela ficha do produto.
- **Produtos, Clientes, Relatórios** (faturamento, ticket médio, entregas, mais vendidos,
  categorias e bairros) e **Ajustes** (dados da loja, bairros e taxas, categorias, ocasiões,
  etapas, usuários, exportação CSV).

## Catálogo — como funciona

- **Abertura** vinho com pétalas caindo, as 7 fotos `ABERTURA01` a `ABERTURA07` passando ao
  fundo (o código tenta `.jpg` e depois `.jpeg`), e a logo redonda recortada
  (`logo-redonda.png`, PNG com fundo transparente — a `logo.jpg` quadrada deixava manchas
  escuras dentro do círculo).
- **Navegação lateral:** um produto por tela, passando com o dedo, pelas setas ou pelas
  teclas. Filtro por ocasião e por categoria no topo. Marcação "3 de 6" com bolinhas.
- **Ampliar a foto:** o cartão já mostra o selo "⌕ Ampliar" na primeira olhada. Tocando na
  foto abre a tela cheia (componente `Lupa`), com um único nível de ampliação — o botão
  alterna entre "Ampliar" e "Reduzir" e o cliente arrasta usando a rolagem do navegador.
  **Não usar pinça nem `transform: scale`:** foi tentado na FA e travava a tela em alguns
  celulares. Enquanto a foto está aberta, a página atrás fica travada (`body` fixo) e o
  zoom do navegador é bloqueado. O voltar do celular fecha a foto e devolve ao catálogo.
- **Falar com a loja:** todo produto tem "Ver mais desse tipo" (abre o WhatsApp citando a
  categoria) e "Consultar valores" (citando o produto e o código). O segundo é ligado por
  produto, no cadastro.
- **Promoções:** filtro "🔥 Promoções" no topo, que só aparece quando existe alguma; selo na
  foto e preço antigo riscado.
- **Sacola** salva no navegador; avisa quando há item sob consulta.
- **Formulário antes de enviar:** nome, entregar ou retirar, quem recebe, endereço, bairro
  (mostrando a taxa), data, horário, mensagem do cartão com "de" e "para", forma de
  pagamento e observações. Tudo vai formatado na mensagem do WhatsApp.
- **Pix:** escolhendo Pix, aparece a chave com botão de copiar, e ela também entra no fim da
  mensagem do WhatsApp com o pedido do comprovante. Chave da loja: CNPJ 42077814000174,
  guardada em `settings` — não está fixa no código.
- **Rodapé:** nome da loja, endereço, horário e o crédito
  **"Programa feito por Miguel Borges — (34) 9 9188-1557"**.
- **Rede de proteção** (`Guarda`): qualquer erro mostra um aviso com botão de voltar, nunca
  tela branca.

## Cuidados técnicos

- Nada de `aspect-ratio` no CSS (quebra no Safari antigo): usar `paddingTop` em porcentagem
  com filhos em `position: absolute`. Evitar `inset`; escrever `top/right/bottom/left`.
- Modais usam `dvh`, não `vh`, senão a barra do navegador corta a tela no Android e iPhone.
- **Modais são desenhados por portal (`createPortal` para o `document.body`).** A animação
  de troca de aba (`.px-up`) deixava um `transform` no elemento que envolve o conteúdo, e
  isso fazia o `position: fixed` se ancorar nele em vez da tela — o rodapé com os botões
  Cancelar e Salvar caía para fora do visível no celular. Além do portal, a animação
  deixou de reter o transform (tirado o `both`). **Não voltar o `both` nem tirar o portal.**
- A janela do modal tem altura fixa (`92dvh`) com o miolo rolando por dentro; o cabeçalho e
  o rodapé ficam presos, sem depender de `position: sticky`.
- Campos em duas colunas viram uma só no celular (classes `.px-2col` e `.px-3col`).
- No Cloudflare, **Retry build repete o commit antigo**: para pegar código novo, criar um
  deployment novo ou fazer qualquer commit.
- No Supabase, "Run selected" roda só o trecho marcado: selecionar tudo antes.

## Arquivos no bucket `paixao`

`logo-circulo.jpg` (a que o app e o catálogo usam), `logo.jpg`, `icone.jpg`,
`icone-192.png`, `icone-512.png` e `ABERTURA01` a `ABERTURA07`.

**Cuidado com a logo:** a versão recortada em PNG com fundo transparente
(`logo-redonda.png`) **não deu certo** — ao subir pelo celular a transparência virou um
quadrado preto. A solução foi o `logo-circulo.jpg`: imagem quadrada com o selo
centralizado sobre o creme da própria marca, exibida com `borderRadius: 50%`. O app, o
ícone do navegador e o manifesto apontam todos para esse mesmo arquivo.
Ao subir imagens pelo celular, mandar pela opção de **arquivos**, não pela galeria, que
recomprime.

## Espaço do Supabase e acessos ao catálogo

O plano gratuito guarda **1 GB** de arquivos. Foto de celular tem de 3 a 8 MB; sem tratamento o espaço acabaria em 150 a 300 fotos. Mesma receita aplicada na Udiflex, Danny e Caroline.

1. **A foto encolhe sozinha antes de subir.** `uploadFile` chama `encolherImagem`: no máximo 1600 pixels no lado maior, WebP (ou JPEG, se o navegador não gerar WebP), qualidade 0,82. Cada foto cai para 200 a 350 KB. Se algo falhar, sobe o original em vez de quebrar o cadastro. Nunca contar com a pessoa editar a foto antes de subir.
2. **Apagar apaga de verdade.** `removeFiles` tira o arquivo do Storage quando a foto é removida, trocada ou o produto é excluído.
3. **Medidor em Ajustes** (só admin): porcentagem do 1 GB, divisão por pasta e o botão **Limpar arquivos sem uso**.
4. **Quem é "sem uso":** `get_orphan_files()` só lista o que está na pasta `produtos`, não pertence a nenhum produto ativo e foi enviado há mais de uma hora. Logo e ícone ficam na raiz do bucket e nunca entram.
5. **Nunca apagar com `delete from storage.objects`** — tira a linha da listagem e deixa o arquivo no servidor; o espaço não volta.
6. Se a permissão de apagar não entrar pelo SQL: Storage → Policies → `paixao` → New policy → For full customization → **DELETE** → `authenticated` → USING `bucket_id = 'paixao'`.

**Acessos ao catálogo.** A aba **Acessos** mostra quantas pessoas abriram o catálogo: hoje, 7 dias, 30 dias, desde o começo, e um gráfico dos últimos 14 dias. A tabela `catalog_visits` guarda só um código sorteado que fica no navegador de quem visita e a data — sem nome, telefone ou endereço de internet. A mesma pessoa só conta de novo depois de 30 minutos. Registro por `log_catalog_visit()` (liberada sem login), leitura por `get_catalog_stats()` (só logado). Datas no horário de Brasília.

**SQL rodado:** `paixao_espaco_acessos.sql`.

## Como o Miguel prefere trabalhar

Pelo celular, editando pelo GitHub no navegador. Para cada arquivo: **link pronto do GitHub
para criar ou editar + o arquivo completo + o número da última linha**. SQL sempre completo,
com o link direto do projeto certo.

## O que falta

- Cadastrar os produtos com foto, os bairros com taxa e testar um pedido de verdade.
- Testar uma promoção de ponta a ponta: pôr, conferir no catálogo, lançar o pedido no app e
  tirar da promoção.
- Avaliar domínio próprio (`.com.br` no Registro.br, cerca de R$ 40/ano) e encurtar o
  endereço do Worker, que hoje é longo.

## Histórico

- **27/09/2026:** projeto criado do zero — banco, app de gestão completo e catálogo com
  navegação lateral. Publicado no Cloudflare.
- **27/09/2026 (noite):** manifesto e ícones para instalar na tela inicial; campos em duas
  colunas passaram a virar uma só no celular; modais passaram a usar `dvh`.
- **28/09/2026 (2ª rodada):** aviso de que a entrega tem taxa na abertura do catálogo;
  saudação do app passou a mostrar o nome da loja; botões "Ver mais desse tipo" e "Consultar
  valores" em cada produto; "sob consulta" ganhou valor de referência; chave Pix na tela e na
  mensagem do pedido; e **promoções** — campo na ficha do produto, aba de gestão no app e
  destaque no catálogo.
- **28/09/2026:** rodapé com o crédito do programador; abertura clareada (véu mais leve e
  fotos mais visíveis); logo trocada pelo `logo-circulo.jpg` (a versão PNG transparente
  virava quadrado preto ao ser enviada pelo celular); e **ampliação de foto** no catálogo,
  com o selo "Ampliar" já visível no cartão e a tela cheia com Ampliar/Reduzir, testada em
  Android, iPhone e computador; e correção do modal, cujos botões Cancelar e Salvar ficavam
  fora da tela no celular.

## Como continuar numa conta nova do Claude

1. No GitHub: **Code → Download ZIP**.
2. Numa conversa nova, envie o ZIP e escreva: *"Leia o CONTEXTO.md e vamos continuar o projeto."*
3.

- **29/09/2026:** foto passou a encolher sozinha antes de subir, exclusão passou a liberar espaço de verdade, medidor do 1 GB com limpeza em Ajustes e aba nova **Acessos**. SQL: `paixao_espaco_acessos.sql`.
- **07/10/2026:** correção em Ajustes no celular. (1) O teclado fechava a cada letra ao digitar categoria, ocasião ou etapa: o componente `Lista` estava declarado dentro de `Ajustes` e era recriado a cada tecla; virou a função `lista({...})`. **Não voltar a usar `<Lista />` nem declarar componente dentro de outro.** (2) A tela ficava cortada à direita: grades `1fr` não encolhiam abaixo do conteúdo; trocadas por `minmax(0,1fr)`, com `minWidth: 0` nos campos e `flexShrink: 0` nos botões. Vale para `.px-2col`, `.px-3col` e as grades de Produtos, Clientes, Promoções, Relatórios e Ajustes.
