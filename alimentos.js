/* Base de alimentos FRANX · macros por 100 g (peso en el estado indicado: cocinado/escurrido/crudo).
   Fuentes: BEDCA y etiquetas habituales en Mercadona/Aldi. Raciones caseras calibradas con las tablas de Jesús
   (p. ej. 2 palmas de pollo cocinado = 185 g; ¾ taza de arroz cocido = 145 g; 2 cdas + ½ cdta de AOVE = 29 g).
   grupo: prot | hc | grasa | fruta | lacteo | verdura | otros
   paso: ración para los botones − / +  ·  rac: raciones caseras para mostrar equivalencias */
window.ALIMENTOS = [
  // ---------- PROTEÍNA ----------
  { id: 'pollo', n: 'Pechuga de pollo (cocinada)', g: 'prot', kcal: 160, p: 31, c: 0, gr: 3.5, paso: ['½ palma', 46], rac: [['palma', 92]] , compra: { sec: 'Carne y pescado', f: 1.33, u: 'g' } },
  { id: 'pavo', n: 'Pechuga de pavo (cocinada)', g: 'prot', kcal: 140, p: 30, c: 0, gr: 2, paso: ['½ palma', 50], rac: [['palma', 100]] , compra: { sec: 'Carne y pescado', f: 1.33, u: 'g' } },
  { id: 'ternera', n: 'Ternera magra (cocinada)', g: 'prot', kcal: 165, p: 27, c: 0, gr: 6, paso: ['½ palma', 52], rac: [['palma', 105]] , compra: { sec: 'Carne y pescado', f: 1.33, u: 'g' } },
  { id: 'solomillo', n: 'Solomillo / lomo de cerdo magro (cocinado)', g: 'prot', kcal: 155, p: 27, c: 0, gr: 5, paso: ['½ palma', 52], rac: [['palma', 105]] , compra: { sec: 'Carne y pescado', f: 1.33, u: 'g' } },
  { id: 'merluza', n: 'Pescado blanco: merluza, bacalao fresco, lubina (cocinado)', g: 'prot', kcal: 95, p: 22.5, c: 0, gr: 1, paso: ['½ palma', 62], rac: [['palma / filete', 125]] , compra: { sec: 'Carne y pescado', f: 1.25, u: 'g' } },
  { id: 'salmon', n: 'Pescado azul: salmón, caballa fresca (cocinado)', g: 'prot', kcal: 205, p: 23, c: 0, gr: 12.5, paso: ['½ palma', 60], rac: [['palma / filete', 120]] , compra: { sec: 'Carne y pescado', f: 1.2, u: 'g' } },
  { id: 'gambas', n: 'Gambas / langostinos cocidos pelados', g: 'prot', kcal: 95, p: 22, c: 0.5, gr: 1, paso: ['½ palma', 60], rac: [['palma', 120], ['taza', 150]] , compra: { sec: 'Carne y pescado', f: 1, u: 'g' } },
  { id: 'sepia', n: 'Sepia / calamar (plancha)', g: 'prot', kcal: 90, p: 19, c: 1, gr: 1.2, paso: ['½ palma', 60], rac: [['palma', 120]] , compra: { sec: 'Carne y pescado', f: 1.3, u: 'g' } },
  { id: 'atun', n: 'Atún al natural (escurrido)', g: 'prot', kcal: 110, p: 25, c: 0, gr: 1, paso: ['1 lata pequeña', 56], rac: [['lata pequeña', 56], ['lata de 75 g', 75]] , compra: { sec: 'Despensa', f: 1, u: 'lata', pz: 56 } },
  { id: 'sardina', n: 'Sardinas / caballa en lata (escurridas)', g: 'prot', kcal: 210, p: 24, c: 0, gr: 12.5, paso: ['1 lata', 60], rac: [['lata', 60]] , compra: { sec: 'Despensa', f: 1, u: 'lata', pz: 60 } },
  { id: 'huevo', n: 'Huevo entero', g: 'prot', kcal: 140, p: 12.5, c: 0.7, gr: 9.8, paso: ['1 huevo', 55], rac: [['huevo', 55]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'ud', pz: 55 } },
  { id: 'claras', n: 'Claras de huevo', g: 'prot', kcal: 50, p: 11, c: 0.7, gr: 0.2, paso: ['1 clara', 33], rac: [['clara', 33], ['vaso', 250]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'ml' } },
  { id: 'jamon', n: 'Jamón serrano (sin grasa visible)', g: 'prot', kcal: 205, p: 31, c: 0, gr: 9, paso: ['2 lonchas', 24], rac: [['loncha fina', 12]] , compra: { sec: 'Carne y pescado', f: 1, u: 'g' } },
  { id: 'fiambrepavo', n: 'Fiambre de pechuga de pavo (>90 %)', g: 'prot', kcal: 100, p: 20, c: 1.5, gr: 1.5, paso: ['2 lonchas', 30], rac: [['loncha', 15]] , compra: { sec: 'Carne y pescado', f: 1, u: 'g' } },
  { id: 'tofu', n: 'Tofu firme', g: 'prot', kcal: 125, p: 13, c: 1.5, gr: 7.5, paso: ['½ taco', 60], rac: [['taco', 125]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'g' } },
  { id: 'whey', n: 'Proteína whey (polvo)', g: 'prot', kcal: 380, p: 78, c: 6, gr: 5, paso: ['1 cacito', 30], rac: [['cacito', 30]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  // ---------- LÁCTEOS ----------
  { id: 'yogurpro', n: 'Yogur / skyr alto en proteína natural', g: 'lacteo', kcal: 62, p: 10, c: 4, gr: 0.3, paso: ['½ bol', 75], rac: [['bol pequeño', 150], ['bol mediano', 200], ['envase', 200]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'g' } },
  { id: 'quesofresco', n: 'Queso fresco batido / Burgos 0 %', g: 'lacteo', kcal: 70, p: 11, c: 4, gr: 0.5, paso: ['½ tarrina', 62], rac: [['tarrina individual grande', 125]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'g' } },
  { id: 'cottage', n: 'Queso cottage', g: 'lacteo', kcal: 95, p: 12, c: 3, gr: 4, paso: ['½ tarrina', 100], rac: [['tarrina', 200]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'g' } },
  { id: 'leche', n: 'Leche semidesnatada', g: 'lacteo', kcal: 46, p: 3.3, c: 4.8, gr: 1.6, paso: ['½ vaso', 125], rac: [['vaso', 250], ['vaso pequeño', 200]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'ml' } },
  { id: 'lechesin', n: 'Bebida de soja sin azúcar', g: 'lacteo', kcal: 35, p: 3.3, c: 0.5, gr: 1.9, paso: ['½ vaso', 125], rac: [['vaso', 250]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'ml' } },
  // ---------- HIDRATOS ----------
  { id: 'arroz', n: 'Arroz cocido', g: 'hc', kcal: 130, p: 2.7, c: 28, gr: 0.3, paso: ['¼ taza', 48], rac: [['taza', 193]] , compra: { sec: 'Despensa', f: 0.36, u: 'g' } },
  { id: 'pasta', n: 'Pasta cocida', g: 'hc', kcal: 155, p: 5.5, c: 30, gr: 0.9, paso: ['¼ taza', 38], rac: [['taza', 152]] , compra: { sec: 'Despensa', f: 0.42, u: 'g' } },
  { id: 'cuscus', n: 'Cuscús cocido', g: 'hc', kcal: 112, p: 3.8, c: 23, gr: 0.2, paso: ['¼ taza', 40], rac: [['taza', 160]] , compra: { sec: 'Despensa', f: 0.4, u: 'g' } },
  { id: 'quinoa', n: 'Quinoa cocida', g: 'hc', kcal: 120, p: 4.4, c: 21, gr: 1.9, paso: ['¼ taza', 46], rac: [['taza', 185]] , compra: { sec: 'Despensa', f: 0.37, u: 'g' } },
  { id: 'patata', n: 'Patata cocida / al horno', g: 'hc', kcal: 77, p: 2, c: 17, gr: 0.1, paso: ['½ mediana', 85], rac: [['pequeña', 120], ['mediana', 170], ['mediana-grande', 220]] , compra: { sec: 'Fruta y verdura', f: 1.05, u: 'g' } },
  { id: 'boniato', n: 'Boniato cocinado', g: 'hc', kcal: 90, p: 2, c: 20.7, gr: 0.2, paso: ['¼ pequeño', 33], rac: [['pequeño', 130], ['mediano', 200]] , compra: { sec: 'Fruta y verdura', f: 1.1, u: 'g' } },
  { id: 'pan', n: 'Pan integral', g: 'hc', kcal: 247, p: 10, c: 41, gr: 3.4, paso: ['1 rebanada', 30], rac: [['rebanada mediana', 30], ['rebanada grande', 40], ['rebanada grande y gruesa', 50]] , compra: { sec: 'Panadería', f: 1, u: 'g' } },
  { id: 'avena', n: 'Copos de avena (crudos)', g: 'hc', kcal: 375, p: 13, c: 60, gr: 7, paso: ['2 cdas', 16], rac: [['cucharada', 8], ['taza', 80]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  { id: 'tortitas', n: 'Tortitas de arroz / maíz', g: 'hc', kcal: 385, p: 8, c: 81, gr: 2.8, paso: ['1 tortita', 8], rac: [['tortita', 8]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  { id: 'lentejas', n: 'Lentejas cocidas', g: 'hc', kcal: 116, p: 9, c: 20, gr: 0.4, paso: ['¼ taza', 50], rac: [['taza', 200]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  { id: 'garbanzos', n: 'Garbanzos cocidos', g: 'hc', kcal: 140, p: 7.5, c: 21, gr: 2.5, paso: ['¼ taza', 45], rac: [['taza', 180]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  // ---------- FRUTA ----------
  { id: 'manzana', n: 'Manzana / pera', g: 'fruta', kcal: 52, p: 0.3, c: 14, gr: 0.2, paso: ['1 pieza', 180], rac: [['pequeña', 150], ['mediana', 180]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'ud', pz: 180 } },
  { id: 'naranja', n: 'Naranja / mandarinas', g: 'fruta', kcal: 47, p: 0.9, c: 12, gr: 0.1, paso: ['1 pieza', 200], rac: [['naranja', 200]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'ud', pz: 200 } },
  { id: 'platano', n: 'Plátano', g: 'fruta', kcal: 89, p: 1.1, c: 23, gr: 0.3, paso: ['1 pieza', 120], rac: [['mediano', 120]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'ud', pz: 120 } },
  { id: 'frutosrojos', n: 'Fresas / frutos rojos', g: 'fruta', kcal: 35, p: 0.7, c: 7.5, gr: 0.3, paso: ['1 taza', 150], rac: [['taza', 150]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'g' } },
  { id: 'kiwi', n: 'Kiwi', g: 'fruta', kcal: 61, p: 1.1, c: 14, gr: 0.5, paso: ['1 pieza', 75], rac: [['kiwi', 75]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'ud', pz: 75 } },
  // ---------- GRASAS ----------
  { id: 'aove', n: 'Aceite de oliva virgen extra', g: 'grasa', kcal: 900, p: 0, c: 0, gr: 100, paso: ['1 cdta', 4.5], rac: [['cucharada', 13], ['cucharadita', 4.5]] , compra: { sec: 'Despensa', f: 1, u: 'ml' } },
  { id: 'aguacate', n: 'Aguacate', g: 'grasa', kcal: 160, p: 2, c: 2, gr: 15, paso: ['⅓ aguacate', 50], rac: [['mediano', 150], ['grande', 190]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'ud', pz: 150 } },
  { id: 'nueces', n: 'Nueces / frutos secos naturales', g: 'grasa', kcal: 654, p: 15, c: 7, gr: 65, paso: ['½ puñado', 12], rac: [['puñado pequeño', 20], ['puñado', 25]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  { id: 'cacahuete', n: 'Crema de cacahuete 100 %', g: 'grasa', kcal: 600, p: 25, c: 12, gr: 50, paso: ['1 cda rasa', 14], rac: [['cucharada rasa', 14]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  { id: 'pesto', n: 'Pesto casero', g: 'grasa', kcal: 450, p: 5, c: 4, gr: 45, paso: ['1 cda', 15], rac: [['cucharada', 15], ['cucharada colmada', 20]] , compra: { sec: 'Despensa', f: 1, u: 'g' } },
  { id: 'queso', n: 'Queso curado / semicurado', g: 'grasa', kcal: 390, p: 26, c: 0.5, gr: 32, paso: ['1 loncha', 15], rac: [['loncha', 15]] , compra: { sec: 'Huevos y lácteos', f: 1, u: 'g' } },
  // ---------- VERDURA (libre; cuenta poco) ----------
  { id: 'verdura', n: 'Verdura cocinada: calabacín, pimiento, cebolla, judía verde, calabaza', g: 'verdura', kcal: 30, p: 1.3, c: 5, gr: 0.2, paso: ['½ taza', 80], rac: [['taza', 160]] , compra: { sec: 'Fruta y verdura', f: 1.1, u: 'g' } },
  { id: 'tomate', n: 'Tomate / ensalada', g: 'verdura', kcal: 20, p: 0.9, c: 3.5, gr: 0.2, paso: ['1 pieza', 120], rac: [['tomate', 120]] , compra: { sec: 'Fruta y verdura', f: 1, u: 'ud', pz: 120 } },
  { id: 'champi', n: 'Champiñones / setas', g: 'verdura', kcal: 25, p: 3, c: 1.5, gr: 0.3, paso: ['½ taza', 70], rac: [['taza', 140]], compra: { sec: 'Fruta y verdura', f: 1.1, u: 'g' } }
];

/* Cada línea de los menús de Jesús → [alimento, gramos]. Una línea puede llevar varios alimentos. */
window.MAPA_MENU = {
  '2 huevos': [['huevo', 110]], '2 huevos revueltos': [['huevo', 110]],
  '1 lata pequeña de atún al natural, escurrida': [['atun', 56]],
  '2 rebanadas grandes de pan integral': [['pan', 80]], '2 rebanadas medianas de pan integral': [['pan', 60]],
  '2 rebanadas grandes y gruesas de pan integral': [['pan', 100]],
  '⅔ de aguacate mediano': [['aguacate', 100]], '½ aguacate mediano': [['aguacate', 75]],
  '1 manzana': [['manzana', 180]], '1 naranja': [['naranja', 200]], '1 naranja entera': [['naranja', 200]],
  '1 plátano mediano': [['platano', 120]], '1 plátano mediano en rodajas': [['platano', 120]],
  '1 vaso de leche semidesnatada': [['leche', 250]], '1 vaso pequeño de leche semidesnatada': [['leche', 200]],
  '1 vaso de leche para cocer la avena': [['leche', 250]],
  '1 cucharadita de AOVE para la tortilla': [['aove', 4.5]], '1 cucharadita de AOVE para cocinar': [['aove', 4.5]],
  '1 cucharadita de AOVE': [['aove', 4.5]], '2 cucharaditas de AOVE': [['aove', 9]], '1 cucharada de AOVE': [['aove', 13]],
  '1 cucharada + 1 cucharadita de AOVE': [['aove', 17.5]], '1 cucharada + 2 cucharaditas de AOVE': [['aove', 22]],
  '1½ palmas de pollo': [['pollo', 138]], '1¼ palmas de pollo en dados': [['pollo', 115]],
  '1½ tazas de arroz cocido': [['arroz', 290]], '1 taza de arroz cocido': [['arroz', 193]], '1¼ tazas de arroz cocido': [['arroz', 241]],
  '1½–2 palmas de merluza': [['merluza', 220]], '2 palmas de merluza': [['merluza', 250]], '1½–2 palmas de pescado blanco': [['merluza', 220]],
  '½ boniato pequeño cocinado': [['boniato', 65]], '¼ de boniato pequeño cocinado': [['boniato', 33]], '⅓ de boniato pequeño cocinado': [['boniato', 43]],
  '1 palma de pavo asado casero': [['pavo', 100]], '1 palma de pavo en dados': [['pavo', 100]],
  '1 bol pequeño de yogur natural alto en proteína': [['yogurpro', 150]], '1 bol pequeño de yogur alto en proteína': [['yogurpro', 150]],
  '1 bol mediano de yogur natural alto en proteína': [['yogurpro', 200]],
  '1½ palmas de ternera magra, en tiras': [['ternera', 158]], '1½ palmas de solomillo magro': [['solomillo', 158]],
  '1¾ tazas de pasta cocida': [['pasta', 266]], '1½ tazas escasas de pasta cocida': [['pasta', 215]],
  '2 cucharadas de pesto casero': [['pesto', 30]], '1 cucharada colmada de pesto casero': [['pesto', 20]],
  '8 cucharadas de copos de avena (antes de cocer)': [['avena', 64]], '7 cucharadas de copos de avena (antes de cocer)': [['avena', 56]],
  '3 cucharadas rasas de crema de cacahuete 100 %': [['cacahuete', 42]], '2 cucharadas rasas de crema de cacahuete 100 %': [['cacahuete', 28]],
  '1 patata mediana-grande cocida': [['patata', 220]], '1 patata mediana cocida': [['patata', 170]],
  '1½ palmas de salmón': [['salmon', 180]],
  '1¾ tazas de cuscús cocido': [['cuscus', 280]], '1⅓ tazas de cuscús cocido': [['cuscus', 213]],
  '4 lonchas finas de jamón serrano': [['jamon', 48]],
  '1 puñado de nueces en el yogur': [['nueces', 25]], '1 puñado pequeño de nueces en el yogur': [['nueces', 20]],
  '1 puñado de nueces': [['nueces', 25]], '1 puñado pequeño de nueces': [['nueces', 20]],
  '2 palmas de gambas peladas': [['gambas', 240]],
  '1 tarrina individual grande de queso fresco ligero': [['quesofresco', 125]]
};
