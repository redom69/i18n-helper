const fs = require('fs');
const path = require('path');

// 📌 Ruta de los archivos de traducción
const translationsDir = path.join(__dirname, '../marsi_connect/src/locales');
const locales = ['en', 'es']; // Puedes agregar más idiomas si los tienes

// 📌 Función para cargar traducciones desde un archivo `.ts`
function loadTranslations(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
    return {};
  }

  try {
    const translations = require(filePath); // Usamos require para cargar el archivo .ts como un módulo JS
    return translations;
  } catch (error) {
    console.error(`❌ Error al cargar el archivo ${filePath}:`, error);
    return {};
  }
}

// 📌 Función recursiva para obtener todas las claves de un objeto, incluyendo las anidadas
// 📌 Función recursiva para obtener todas las claves de un objeto, incluyendo las anidadas
function extractKeys(obj, prefix = '') {
  let keys = [];
  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    // Eliminar el prefijo 'default.' si existe
    const cleanKey = fullKey.startsWith('default.')
      ? fullKey.slice(8)
      : fullKey;

    keys.push(cleanKey);
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys = keys.concat(extractKeys(obj[key], cleanKey)); // Recursión para claves anidadas
    }
  });
  return keys;
}

// 📌 Función para encontrar claves faltantes entre idiomas
function findMissingKeys(allTranslations) {
  const allKeys = new Set();
  const missingKeys = {};

  // Extraer todas las claves de todos los archivos
  Object.values(allTranslations).forEach((translations) => {
    const keys = extractKeys(translations);
    keys.forEach((key) => allKeys.add(key));
  });

  // Comparar cada idioma con la lista total de claves
  for (const locale of locales) {
    missingKeys[locale] = [];
    const localeKeys = new Set(extractKeys(allTranslations[locale] || {}));

    // Comparar claves del idioma con las claves globales
    allKeys.forEach((key) => {
      if (!localeKeys.has(key)) {
        missingKeys[locale].push(key);
      }
    });
  }

  return missingKeys;
}

// 📌 Ejecutar el proceso para cada idioma
const allTranslations = {};

// Cargar y ordenar cada archivo de traducción
for (const locale of locales) {
  const filePath = path.join(translationsDir, `${locale}.json`);
  const translations = loadTranslations(filePath);
  allTranslations[locale] = translations;
}

// 📌 Buscar claves faltantes entre idiomas
const missingKeys = findMissingKeys(allTranslations);

// 📌 Mostrar reporte de claves faltantes
console.log('\n🔍 Claves faltantes en cada idioma:');
for (const [locale, keys] of Object.entries(missingKeys)) {
  if (keys.length > 0) {
    console.log(`❌ [${locale}] Faltan ${keys.length} claves:`);
    console.log(keys);
  } else {
    console.log(`✅ [${locale}] Todas las claves están completas`);
  }
}
