## Organização do Repositório

- **Foco Exclusivo no P.A.:** Este repositório é destinado apenas a conteúdos relacionados ao Projeto de Aprendizagem (P.A.). Materiais, atividades ou códigos que não estejam diretamente ligados ao P.A. devem ser realizados em repositórios ou pastas específicas para cada disciplina.
- **Estrutura Clara:** Mantenha uma estrutura de diretórios organizada (ex.: `docs/`, `src/`, `tests/`), garantindo que cada arquivo ou código esteja no local adequado.

## Fluxo de Trabalho

1. **Fork e Clone:**
   - Se você não possui acesso direto ao repositório, faça um *fork* e depois clone-o na sua máquina.
   - Se você faz parte da equipe, clone diretamente o repositório.

2. **Criação de Branch:**
   - Sempre que for iniciar uma nova funcionalidade, correção ou melhoria, crie uma branch local com um nome significativo, por exemplo:
     - `feature/nome-da-funcionalidade`
     - `fix/nome-do-bug`
     - `hotfix/descritivo`
   - Isso evita a inserção de código quebrado diretamente na branch principal.

3. **Commits Frequentes e Descritivos:**
   - Faça commits pequenos e focados, contendo alterações específicas.
   - Use mensagens de commit claras e detalhadas (ex.: `[FEATURE] Adiciona validação de formulário` ou `[FIX] Corrige erro de renderização do layout`).
   [Guia de nomeação para commits](https://github.com/joaovidalsenai/Projeto-de-Aprendizagem-2025/blob/main/_guias/COMMITS.md)

4. **Pull Request (PR):**
   - Antes de mesclar suas alterações na branch `main`, submeta um Pull Request.
   - No PR, inclua uma descrição detalhada das mudanças e as razões das alterações. Isso facilita a revisão e a integração do código.

## Boas Práticas de Codificação e Testes

- **Código Limpo e Bem Documentado:**
  - Escreva código de forma legível e mantenha uma documentação adequada. Se necessário, comente trechos complexos para facilitar a compreensão.
- **Padronização:**
  - Utilize as convenções e padrões adotados pelo projeto, incluindo formatação, linting e demais boas práticas definidas.
- **Testes:**
  - Certifique-se de que o código novo ou alterado esteja funcionando corretamente, executando os testes automatizados e, sempre que possível, adicionando novos testes.
  - Verifique se as alterações não comprometem funcionalidades já existentes.

## Revisões e Aprovação de Código

- **Revisão de Pull Requests:**
  - Todas as contribuições deverão ser revisadas pela equipe antes de serem integradas na branch `main`.
  - Mantenha uma postura aberta a feedbacks e participe ativamente das discussões durante a revisão.
- **Integração Contínua:**
  - Utilize os recursos de integração contínua (CI) do repositório para garantir que os testes estejam passando e que o código esteja sem erros.

## Comunicação e Organização das Issues

- **Uso do GitHub Issues:**
  - Para reportar bugs, sugerir novas funcionalidades ou discutir melhorias, utilize a aba de Issues.
  - Procure ser claro e detalhado ao descrever problemas ou ideias.
- **Discussão Construtiva:**
  - Promova um ambiente colaborativo e respeitoso nas discussões e revisões de código. O feedback deve ser sempre construtivo e orientado à melhoria do projeto.

## Regras Específicas para o Projeto

- **Manutenção do Foco:**  
  - Evite commits ou pull requests que tragam conteúdos que não estejam diretamente relacionados ao Projeto de Aprendizagem.
- **Branches e Código Estável:**  
  - Nunca comite diretamente na branch `main`. Todas as alterações devem ser realizadas em branches separadas e validadas através de Pull Requests.
- **Atualização Contínua:**  
  - Mantenha sua branch atualizada com a branch `main` para reduzir conflitos e facilitar a integração das mudanças.
