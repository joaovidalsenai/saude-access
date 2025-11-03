export default {
  // 1. Informa ao Jest para usar o ambiente Node.js
  testEnvironment: 'node',

  // 2. Aponta para o seu arquivo de setup.
  // Esta é a correção principal!
  setupFilesAfterEnv: ['./jest.setup.js'],

  // 3. Configuração para suportar ES Modules (import/export)
  // Isso é necessário porque você está usando `node --experimental-vm-modules`
  transform: {},
};