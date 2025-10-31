// jest.setup.js
import '@testing-library/jest-dom';

// Mock global do AuthUtils
global.AuthUtils = {
  validarEmail: jest.fn(),
  validarSenha: jest.fn(),
  mostrarMensagem: jest.fn()
};

// Mock do fetch
global.fetch = jest.fn();