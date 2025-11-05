// jest.setup.js
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills necessários para Node.js
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock global do AuthUtils
global.AuthUtils = {
  validarEmail: jest.fn(),
  validarSenha: jest.fn(),
  mostrarMensagem: jest.fn()
};

// Mock do fetch
global.fetch = jest.fn();