const mongoose = require('mongoose');

// ── REGISTRO (Usuario) ────────────────────────────────────────────────────────
const registroSchema = new mongoose.Schema({
  dip: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: /^[A-Z0-9\-]{4,20}$/
  },
  nombre: { type: String, required: true, trim: true },
  apellidos: { type: String, required: true, trim: true },
  fechaNacimiento: { type: Date, required: true },
  rol: {
    type: String,
    enum: ['administrador', 'miembro', 'entidad', 'visitante', 'moderador'],
    default: 'miembro'
  },
  passwordHash: { type: String, required: true },
  totpSecret: { type: String, required: true },
  totpVerified: { type: Boolean, default: false },
  bloqueado: { type: Boolean, default: false },
  intentosFallidos: { type: Number, default: 0 },
  ultimoBloqueo: { type: Date },
  activo: { type: Boolean, default: true },
  creadoEn: { type: Date, default: Date.now },
  ultimoAcceso: { type: Date }
});

// Calcular edad dinámica
registroSchema.virtual('edad').get(function () {
  const hoy = new Date();
  const nac = new Date(this.fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
});

registroSchema.set('toJSON', { virtuals: true });

// ── LOG DE AUTENTICACIÓN ──────────────────────────────────────────────────────
const logSchema = new mongoose.Schema({
  dip: { type: String },
  registroId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro' },
  servicio: { type: String, required: true },      // web/servicio que solicitó acceso
  servicioUrl: { type: String },
  evento: {
    type: String,
    enum: [
      'intento_exitoso',
      'error_credenciales',
      'error_2fa',
      'cuenta_bloqueada',
      'bloqueo_activado',
      'desbloqueo',
      'registro_creado',
      'totp_configurado'
    ],
    required: true
  },
  ip: { type: String },
  userAgent: { type: String },
  fase: { type: String, enum: ['fase1', 'fase2', 'completa'] },
  intentoNumero: { type: Number },
  metadatos: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

logSchema.index({ dip: 1, timestamp: -1 });
logSchema.index({ timestamp: -1 });

// ── SOLICITANTE (Aplicación/Servicio) ─────────────────────────────────────────
const solicitanteSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  urlOrigen: { type: String, required: true, trim: true }, // URL donde se usa
  apiKey: { type: String, required: true, unique: true }, // Clave única para validar
  activo: { type: Boolean, default: true },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro' }, // Admin que lo creó
  creadoEn: { type: Date, default: Date.now },
  ultimaUsaEn: { type: Date }
});

solicitanteSchema.index({ urlOrigen: 1 });

const Registro = mongoose.model('Registro', registroSchema);
const Log = mongoose.model('Log', logSchema);
const Solicitante = mongoose.model('Solicitante', solicitanteSchema);

module.exports = { Registro, Log, Solicitante };
