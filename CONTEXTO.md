# Flores e Presentes Paixão — Contexto do projeto

> **Para o Claude:** este arquivo resume o projeto inteiro. Leia antes de propor mudanças.
> Ao terminar cada alteração, atualize o "Histórico" e entregue este arquivo junto.
>
> Última atualização: 28/09/2026

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
`public/manifest.json` (25) · `src/config.js` (6) · `src/main.jsx` (9) · `src/api.js` (344) ·
`src/App.jsx` (1891) · `src/Catalog.jsx` (766)

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

Produtos aceitam: preço fechado, "a partir de", **sob consulta**, tamanhos P/M/G com preços
diferentes, controle de estoque opcional (para pelúcias e canecas) e ocasiões.

## App — o que existe

- **Hoje:** agenda de entregas do dia, atrasados, o que sai amanhã, vendas do mês e a receber.
- **Pedidos:** filtros, busca, cadastro em 5 passos (quem compra, itens, entrega, cartão,
  valores). O bairro traz a taxa sozinho; cliente novo entra no cadastro automaticamente.
  A ficha muda etapa, marca pago, abre o endereço no mapa, avisa pelo WhatsApp e cancela.
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
- **Sacola** salva no navegador; avisa quando há item sob consulta.
- **Formulário antes de enviar:** nome, entregar ou retirar, quem recebe, endereço, bairro
  (mostrando a taxa), data, horário, mensagem do cartão com "de" e "para", forma de
  pagamento e observações. Tudo vai formatado na mensagem do WhatsApp.
- **Rodapé:** nome da loja, endereço, horário e o crédito
  **"Programa feito por Miguel Borges — (34) 9 9188-1557"**.
- **Rede de proteção** (`Guarda`): qualquer erro mostra um aviso com botão de voltar, nunca
  tela branca.

## Cuidados técnicos

- Nada de `aspect-ratio` no CSS (quebra no Safari antigo): usar `paddingTop` em porcentagem
  com filhos em `position: absolute`. Evitar `inset`; escrever `top/right/bottom/left`.
- Modais usam `dvh`, não `vh`, senão a barra do navegador corta a tela no Android e iPhone.
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

## Como o Miguel prefere trabalhar

Pelo celular, editando pelo GitHub no navegador. Para cada arquivo: **link pronto do GitHub
para criar ou editar + o arquivo completo + o número da última linha**. SQL sempre completo,
com o link direto do projeto certo.

## O que falta

- Cadastrar os produtos com foto, os bairros com taxa e testar um pedido de verdade.
- Retorno da reunião com a dona (28/09) com os ajustes que ela pedir.
- Avaliar domínio próprio (`.com.br` no Registro.br, cerca de R$ 40/ano) e encurtar o
  endereço do Worker, que hoje é longo.

## Histórico

- **27/09/2026:** projeto criado do zero — banco, app de gestão completo e catálogo com
  navegação lateral. Publicado no Cloudflare.
- **27/09/2026 (noite):** manifesto e ícones para instalar na tela inicial; campos em duas
  colunas passaram a virar uma só no celular; modais passaram a usar `dvh`.
- **28/09/2026:** rodapé com o crédito do programador; abertura clareada (véu mais leve e
  fotos mais visíveis); logo trocada pelo `logo-circulo.jpg` (a versão PNG transparente
  virava quadrado preto ao ser enviada pelo celular); e **ampliação de foto** no catálogo,
  com o selo "Ampliar" já visível no cartão e a tela cheia com Ampliar/Reduzir, testada em
  Android, iPhone e computador.

## Como continuar numa conta nova do Claude

1. No GitHub: **Code → Download ZIP**.
2. Numa conversa nova, envie o ZIP e escreva: *"Leia o CONTEXTO.md e vamos continuar o projeto."*
3.
