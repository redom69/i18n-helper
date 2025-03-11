const fs = require('fs');
const path = require('path');
const tsNode = require('ts-node');

// 📌 Ruta de los archivos de traducción
const translationsDir = path.join(
  __dirname,
  '../apps/marsinet/src/assets/i18n'
);
const locales = ['en', 'es']; // Agrega más idiomas según sea necesario

// Inicializar ts-node para permitir ejecución de archivos TypeScript
tsNode.register();

// 📌 Función para cargar traducciones desde un archivo `.ts`
function loadTranslations(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Archivo no encontrado: ${filePath}`);
    return {};
  }

  try {
    const translations = require(filePath);
    return translations.default || translations;
  } catch (error) {
    console.error(`❌ Error al cargar el archivo ${filePath}:`, error);
    return {};
  }
}

// 📌 Función recursiva para extraer todas las claves de un objeto (incluyendo las anidadas)
function extractKeys(obj, prefix = '') {
  let keys = [];
  Object.keys(obj).forEach((key) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const cleanKey = fullKey.startsWith('default.')
      ? fullKey.slice(8)
      : fullKey;

    keys.push(cleanKey);
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys = keys.concat(extractKeys(obj[key], cleanKey));
    }
  });
  return keys;
}

// 📌 Función para encontrar claves faltantes y mostrar sus valores en todos los idiomas
function findMissingKeys(allTranslations) {
  const allKeys = new Set();
  const missingKeys = {};

  // Extraer todas las claves de todos los archivos
  Object.values(allTranslations).forEach((translations) => {
    extractKeys(translations).forEach((key) => allKeys.add(key));
  });

  // Comparar cada idioma con la lista total de claves
  for (const locale of locales) {
    missingKeys[locale] = [];

    const localeKeys = new Set(extractKeys(allTranslations[locale] || {}));

    allKeys.forEach((key) => {
      if (!localeKeys.has(key)) {
        // Obtener la traducción de esta clave en todos los idiomas disponibles
        const translationsInOtherLanguages = {};
        for (const refLocale of locales) {
          if (refLocale !== locale && allTranslations[refLocale]) {
            const referenceText = getValueFromKey(
              allTranslations[refLocale],
              key
            );
            if (referenceText) {
              translationsInOtherLanguages[refLocale] = referenceText;
            }
          }
        }

        missingKeys[locale].push({
          key,
          translations: translationsInOtherLanguages,
        });
      }
    });
  }

  return missingKeys;
}

// 📌 Función para obtener el valor de una clave en un objeto anidado
function getValueFromKey(obj, key) {
  return key
    .split('.')
    .reduce((acc, part) => (acc && acc[part] ? acc[part] : null), obj);
}

// 📌 Ejecutar el proceso para cada idioma
const allTranslations = {};

// Cargar y ordenar cada archivo de traducción
for (const locale of locales) {
  const filePath = path.join(translationsDir, `${locale}.ts`);
  allTranslations[locale] = loadTranslations(filePath);
}

// 📌 Buscar claves faltantes entre idiomas
const missingKeys = findMissingKeys(allTranslations);

// 📌 Mostrar reporte de claves faltantes con descripciones en todos los idiomas
console.log('\n🔍 Claves faltantes en cada idioma:');
for (const [locale, keys] of Object.entries(missingKeys)) {
  if (keys.length > 0) {
    console.log(`❌ [${locale}] Faltan ${keys.length} claves:\n`);
    keys.forEach(({ key, translations }) => {
      console.log(`  - ${key}`);
      for (const [lang, text] of Object.entries(translations)) {
        console.log(`    📌 ${lang}: "${text}"`);
      }
      if (Object.keys(translations).length === 0) {
        console.log(`    ⚠️ No se encontró en ningún idioma.`);
      }
    });
    console.log('\n');
  } else {
    console.log(`✅ [${locale}] Todas las claves están completas`);
  }
}
