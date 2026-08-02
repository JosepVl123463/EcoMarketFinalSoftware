#!/usr/bin/env python3
"""
Genera documentacion profesional PDF: Entrevista + Casos de Uso
EcoMarket - UNAP Puno
"""
from fpdf import FPDF
from datetime import datetime

class PDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("Helvetica", "I", 7)
            self.set_text_color(120, 120, 120)
            self.cell(95, 4, "EcoMarket - UNAP Puno", align="L")
            self.cell(95, 4, f"Pagina {self.page_no()}/{{nb}}", align="R", new_x="LMARGIN", new_y="NEXT")
            self.set_draw_color(200, 200, 200)
            self.line(10, 12, 200, 12)
            self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 6)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f"Documento generado el {datetime.now().strftime('%d/%m/%Y')}", align="C")

    def chapter_title(self, num, title):
        self.ln(4)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(27, 94, 32)
        prefix = f"{num}. " if num else ""
        self.cell(0, 10, f"{prefix}{title}", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(27, 94, 32)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def sub_title(self, title):
        self.ln(2)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(50, 50, 50)
        self.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
        self.ln(1)

    def body_text(self, txt):
        self.set_x(10)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(190, 5, txt)
        self.ln(2)

    def interview_q(self, q, a):
        self.set_x(10)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(27, 94, 32)
        self.multi_cell(190, 5, f"P: {q}")
        self.set_x(10)
        self.set_font("Helvetica", "", 10)
        self.set_text_color(30, 30, 30)
        self.multi_cell(190, 5, f"R: {a}")
        self.ln(3)

    def use_case_box(self, codigo, nombre, actores, descripcion, precondicion, flujo, postcondicion):
        self.set_x(10)
        # check if we need a new page
        if self.get_y() > 240:
            self.add_page()
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(27, 94, 32)
        self.cell(0, 6, f"{codigo}: {nombre}", new_x="LMARGIN", new_y="NEXT")
        self.set_font("Helvetica", "", 9)
        self.set_text_color(30, 30, 30)
        items = [
            ("Actores:", actores),
            ("Descripcion:", descripcion),
            ("Precondicion:", precondicion),
            ("Flujo principal:", flujo),
            ("Postcondicion:", postcondicion),
        ]
        for label, val in items:
            self.set_x(15)
            self.set_font("Helvetica", "B", 9)
            self.cell(25, 5, label)
            self.set_font("Helvetica", "", 9)
            self.multi_cell(155, 5, val)
        self.ln(4)


pdf = PDF()
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=20)

# ──────────────────────────────────────────────────────────
# PORTADA
# ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.ln(35)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(27, 94, 32)
pdf.cell(0, 12, "EcoMarket", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.set_font("Helvetica", "", 16)
pdf.set_text_color(50, 50, 50)
pdf.cell(0, 10, "Plataforma de Comercio Electronico de Productos", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 10, "Ecologicos con Auditoria Quimica mediante IA", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(8)
pdf.set_draw_color(27, 94, 32)
pdf.line(60, pdf.get_y(), 150, pdf.get_y())
pdf.ln(10)
pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(30, 30, 30)
pdf.cell(0, 7, "Documento de Analisis: Entrevista y Casos de Uso", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(25)
pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 6, "Universidad Nacional del Altiplano Puno (UNAP)", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, "Facultad de Ingenieria de Sistemas", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, "Escuela Profesional de Ingenieria de Sistemas", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.ln(12)
pdf.cell(0, 6, "Curso: Ingenieria de Software", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, "Docente: Consorcio de Ingenieria de Software", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, "Region: Puno - Peru", align="C", new_x="LMARGIN", new_y="NEXT")
pdf.cell(0, 6, f"Fecha: {datetime.now().strftime('%B de %Y')}", align="C", new_x="LMARGIN", new_y="NEXT")

# ──────────────────────────────────────────────────────────
# TABLA DE CONTENIDO
# ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.chapter_title("", "Tabla de Contenido")
pdf.set_font("Helvetica", "", 11)
pdf.set_text_color(30, 30, 30)
toc = [
    "1. Introduccion",
    "   1.1. Contexto del Proyecto",
    "   1.2. Objetivos",
    "2. Entrevista a Productores y Consumidores Locales",
    "   2.1. Metodologia",
    "   2.2. Entrevista a Productor Ecologico",
    "   2.3. Entrevista a Consumidor Local",
    "   2.4. Entrevista a Comerciante",
    "   2.5. Conclusiones de la Entrevista",
    "3. Diagrama de Casos de Uso",
    "   3.1. Diagrama General del Sistema",
    "   3.2. Especificacion de Casos de Uso",
    "4. Glosario de Terminos",
]
for t in toc:
    pdf.cell(0, 6, t, new_x="LMARGIN", new_y="NEXT")

# ──────────────────────────────────────────────────────────
# 1. INTRODUCCION
# ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.chapter_title("1", "Introduccion")

pdf.sub_title("1.1 Contexto del Proyecto")
pdf.body_text(
    "EcoMarket es una plataforma de comercio electronico disenada para la region de Puno que conecta "
    "a productores locales de productos ecologicos y organicos con consumidores conscientes del medio ambiente. "
    "La region de Puno, ubicada en el altiplano peruano a orillas del lago Titicaca, posee una rica tradicion "
    "agricola basada en cultivos nativos como la quinua, canihua, kiwicha, papas nativas y otros productos "
    "andinos que son producidos de manera tradicional y ecologica por pequenos agricultores."
)
pdf.body_text(
    "Sin embargo, estos productores enfrentan serias dificultades para acceder a mercados mas amplios debido "
    "a la falta de herramientas digitales, la dispersion geografica y la desconfianza de los consumidores "
    "respecto a la autenticidad de los productos ecologicos. EcoMarket surge como una solucion integral "
    "que no solo facilita la venta en linea, sino que incorpora un sistema de auditoria quimica basado en "
    "Inteligencia Artificial que analiza los ingredientes de cada producto y emite certificados de pureza "
    "ecologica con puntuaciones Eco-Score, generando confianza tanto en compradores locales como en "
    "mercados externos."
)

pdf.sub_title("1.2 Objetivos")
pdf.body_text(
    "Objetivo General:\n"
    "Desarrollar una plataforma de comercio electronico para productos ecologicos de la region de Puno "
    "que integre un sistema de auditoria quimica mediante IA para garantizar la autenticidad y calidad "
    "de los productos ofertados."
)
pdf.body_text(
    "Objetivos Especificos:\n"
    "1. Disenar e implementar un catalogo digital de productos ecologicos con filtros por categoria, "
    "Eco-Score y ubicacion geografica.\n"
    "2. Desarrollar un modulo de autenticacion seguro con roles diferenciados para consumidores, "
    "productores y administradores.\n"
    "3. Implementar un motor de auditoria quimica que analice ingredientes mediante IA y calcule "
    "puntuaciones de impacto ambiental y toxicidad.\n"
    "4. Crear un sistema de pagos que soporte metodos locales (Yape, Plin, TuPay) e internacionales (Stripe).\n"
    "5. Generar certificados de auditoria en formato PDF con respaldo de hash criptografico (SHA-256) "
    "para garantizar la inmutabilidad de los resultados."
)

# ──────────────────────────────────────────────────────────
# 2. ENTREVISTA
# ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.chapter_title("2", "Entrevista a Productores y Consumidores Locales")

pdf.sub_title("2.1 Metodologia")
pdf.body_text(
    "Se realizaron entrevistas semiestructuradas a tres actores clave del ecosistema de productos ecologicos "
    "en la region de Puno: un productor agricola, un consumidor local y un comerciante del mercado central "
    "de la ciudad de Puno. Las entrevistas se llevaron a cabo durante el mes de marzo de 2026, en idioma "
    "espanol segun la preferencia del entrevistado. El objetivo fue identificar las necesidades, "
    "expectativas y requerimientos funcionales para la plataforma EcoMarket."
)

pdf.sub_title("2.2 Entrevista a Productor Ecologico")
pdf.body_text(
    "Entrevistado: Juan Quispe Callata\n"
    "Edad: 52 anos\n"
    "Ocupacion: Agricultor ecologico - Comunidad de Chucuito\n"
    "Productos: Quinua real, canihua, papas nativas\n"
    "Fecha: 5 de marzo de 2026"
)

pdf.interview_q(
    "Don Juan, como vende actualmente sus productos ecologicos?",
    "Vendo en la feria sabatina de Puno y a veces a intermediarios que llevan mis productos a "
    "Juliaca y Arequipa. El problema es que los intermediarios me pagan muy poco. Por ejemplo, "
    "la quinua real me compran a 3 soles el kilo y ellos la venden a 12 soles en la ciudad. "
    "No tengo forma de llegar directamente al consumidor final."
)
pdf.interview_q(
    "Que opina de vender sus productos por internet?",
    "Me gustaria, pero no se como hacerlo. Mis hijos me ensenaron a usar WhatsApp, pero una "
    "tienda virtual me parece complicado. Ademas, la gente desconfia, quieren saber si realmente "
    "es organico. Yo tengo mi certificacion del SENASA, pero no se como mostrarla en internet."
)
pdf.interview_q(
    "Que tan importante es para usted que sus productos sean certificados como ecologicos?",
    "Es muy importante. Yo no uso pesticidas ni fertilizantes quimicos, todo es natural, como "
    "se ha hecho siempre en mi comunidad. Pero hay productos que dicen ser organicos y no lo son. "
    "Por eso la certificacion es clave. Si la plataforma pudiera analizar mis productos y dar "
    "un puntaje de confianza, seria bueno para diferenciarme de los que no son genuinos."
)
pdf.interview_q(
    "Que funcionalidades le gustaria que tuviera la plataforma?",
    "Primero, que sea facil de usar, que pueda subir fotos de mis productos con mi celular. "
    "Segundo, que los clientes puedan ver mi certificacion y el analisis de mis productos. "
    "Tercero, que pueda recibir pagos directos sin intermediarios. Y cuarto, que me ayude "
    "a coordinar la entrega, porque a veces vendo a gente de fuera de Puno."
)

pdf.sub_title("2.3 Entrevista a Consumidor Local")
pdf.body_text(
    "Entrevistado: Maria Mamani Huanca\n"
    "Edad: 28 anos\n"
    "Ocupacion: Profesora de nivel primario\n"
    "Lugar: Puno ciudad\n"
    "Fecha: 8 de marzo de 2026"
)

pdf.interview_q(
    "Maria, donde compra actualmente sus alimentos?",
    "Compro en el mercado central y en algunos bodegas del barrio. Me gustaria comprar productos "
    "ecologicos porque he leido que son mas saludables, pero en el mercado no siempre se sabe "
    "cual es realmente organico. Todo se ve igual y a veces los precios son mas altos sin saber "
    "si realmente vale la pena."
)
pdf.interview_q(
    "Le gustaria una plataforma donde pueda comprar productos ecologicos con certificacion?",
    "Si, definitivamente. Sobre todo si puedo ver el analisis de cada producto, como su "
    "puntuacion ecologica y que ingredientes tiene. Tambien me gustaria saber de donde viene "
    "el producto, porque prefiero apoyar a los agricultores de la region. Si la plataforma "
    "tiene entregas a domicilio, mucho mejor, porque a veces no tengo tiempo de ir al mercado."
)
pdf.interview_q(
    "Que metodos de pago prefiere usar?",
    "Uso Yape y Plin casi a diario. Tambien tengo tarjeta de debito. Seria bueno tener "
    "varias opciones. A veces cuando compro por internet me da desconfianza poner los datos "
    "de mi tarjeta, pero si la plataforma es conocida y tiene buena reputacion, lo usaria "
    "sin problemas."
)

pdf.sub_title("2.4 Entrevista a Comerciante")
pdf.body_text(
    "Entrevistado: Rosa Condori Vilca\n"
    "Edad: 45 anos\n"
    "Ocupacion: Comerciante del Mercado Central de Puno\n"
    "Vende: Productos de la region (quinuas, habas, cebada, quesos)\n"
    "Fecha: 10 de marzo de 2026"
)

pdf.interview_q(
    "Sra. Rosa, ha considerado vender sus productos en linea?",
    "Lo he pensado, pero no tengo tiempo para aprender plataformas complicadas. Ademas, "
    "el envio es un problema. Vendo productos frescos y necesito que lleguen rapido. "
    "Tambien me preocupa que los clientes no paguen o me estafen. Prefiero el trato "
    "directo, cara a cara, como siempre se ha hecho."
)
pdf.interview_q(
    "Cree que una plataforma digital le ayudaria a aumentar sus ventas?",
    "Si la plataforma es facil de usar y tiene buena reputacion, si. Sobre todo si atrae "
    "a turistas o gente de afuera de Puno que quiere llevar productos tipicos de calidad. "
    "Muchos turistas vienen y preguntan por quinua real, canihua, quesos de cabra, pero "
    "no siempre encuentran donde comprar con confianza."
)
pdf.interview_q(
    "Que opina de que la plataforma incluya un sistema de auditoria de productos?",
    "Me parece excelente. Asi el cliente puede ver que el producto es realmente organico "
    "y no solo publicidad. Yo vendo productos de comunidades que conozco personalmente, "
    "se como los producen. Si la plataforma puede certificar eso con un analisis, seria "
    "un gran respaldo para nosotros los comerciantes honestos."
)

pdf.sub_title("2.5 Conclusiones de la Entrevista")
pdf.body_text(
    "Del analisis de las entrevistas realizadas a los actores clave de la region de Puno, "
    "se extraen las siguientes conclusiones y requerimientos:\n\n"
    "1. Necesidad de digitalizacion: Los productores locales tienen limitado acceso a canales "
    "de venta directa al consumidor, dependiendo de intermediarios que reducen significativamente "
    "sus margenes de ganancia.\n\n"
    "2. Confianza y certificacion: Existe una demanda clara por parte de los consumidores de "
    "mecanismos que verifiquen la autenticidad de los productos ecologicos. El sistema de "
    "auditoria quimica con Eco-Score es un diferenciador clave.\n\n"
    "3. Facilidad de uso: La plataforma debe ser intuitiva y accesible desde dispositivos "
    "moviles, considerando que muchos productores tienen familiaridad solo con herramientas "
    "basicas como WhatsApp.\n\n"
    "4. Metodos de pago locales: Es indispensable integrar Yape y Plin como metodos de pago "
    "principales, ademas de tarjetas y Stripe para compradores internacionales.\n\n"
    "5. Logistica de entrega: Se requiere un sistema de coordinacion de entregas que considere "
    "tanto la venta local (Puno y alrededores) como envios a otras regiones del pais.\n\n"
    "6. Valoracion del origen: Los consumidores valoran conocer la procedencia geografica de "
    "los productos, prefiriendo aquellos de comunidades locales y con practicas tradicionales "
    "sostenibles."
)

# ──────────────────────────────────────────────────────────
# 3. CASOS DE USO
# ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.chapter_title("3", "Diagrama de Casos de Uso")

pdf.sub_title("3.1 Diagrama General del Sistema")
pdf.body_text(
    "El sistema EcoMarket cuenta con tres actores principales: Cliente (consumidor final), "
    "Productor (vendedor de productos ecologicos) y Administrador (gestion del sistema). "
    "A continuacion se presentan los casos de uso identificados a partir del analisis de "
    "requerimientos y las entrevistas realizadas."
)

pdf.set_font("Courier", "", 8)
pdf.set_text_color(30, 30, 30)
diagrama = (
    "+---------------------------------------------------+\n"
    "|                   EcoMarket                        |\n"
    "|                                                    |\n"
    "|  +-------------+     +--------------+              |\n"
    "|  |  CLIENTE    |     |  PRODUCTOR   |              |\n"
    "|  |             |     |              |              |\n"
    "|  | - Registrar |     | - Registrar  |              |\n"
    "|  | - Login     |     | - Login      |              |\n"
    "|  | - Ver Catal |     | - Gestionar  |              |\n"
    "|  | - Filtrar   |     |   Productos  |              |\n"
    "|  | - Carrito   |     | - Ver Auditor|              |\n"
    "|  | - Comprar   |     | - Recibir    |              |\n"
    "|  | - Ver Audit |     |   Pagos      |              |\n"
    "|  | - Historial |     | - Dashboard  |              |\n"
    "|  +-------------+     +------+-------+              |\n"
    "|                              |                      |\n"
    "|                    +---------v--------+             |\n"
    "|                    |  ADMINISTRADOR   |             |\n"
    "|                    |                  |             |\n"
    "|                    | - Gestionar Usu  |             |\n"
    "|                    | - Auditar Prod   |             |\n"
    "|                    | - Aprobar/Rech   |             |\n"
    "|                    | - Generar Cert   |             |\n"
    "|                    | - Dashboard Gral |             |\n"
    "|                    +------------------+             |\n"
    "+----------------------------------------------------+"
)
pdf.multi_cell(190, 3, diagrama)
pdf.ln(8)

# ──────────────────────────────────────────────────────────
# 3.2 ESPECIFICACION DE CASOS DE USO
# ──────────────────────────────────────────────────────────
pdf.sub_title("3.2 Especificacion de Casos de Uso")

pdf.use_case_box(
    "CU-01",
    "Registro de Usuario",
    "Cliente, Productor",
    "Permite a un nuevo usuario registrarse en la plataforma. Los clientes ingresan datos basicos "
    "(nombre, email, contrasena, telefono, direccion). Los productores ademas proporcionan RUC, "
    "nombre del representante legal, direccion fiscal y certificaciones ecologicas. El sistema "
    "valida los datos y crea la cuenta.",
    "El usuario no debe tener una cuenta activa con el mismo email.",
    "1. El usuario accede al formulario de registro. 2. Selecciona el rol (Cliente o Productor). "
    "3. Completa los campos requeridos. 4. Acepta los terminos y condiciones. 5. El sistema valida "
    "los datos y verifica que el email no este registrado. 6. El sistema crea la cuenta y envía "
    "un correo de bienvenida. 7. El sistema retorna un token JWT para inicio de sesion automatico.",
    "El usuario queda registrado y autenticado en el sistema. Se crea un registro en la base de "
    "datos con estado 'activo'."
)

pdf.use_case_box(
    "CU-02",
    "Inicio de Sesion",
    "Cliente, Productor, Administrador",
    "Permite a un usuario registrado autenticarse en la plataforma mediante email y contrasena, "
    "obteniendo un token JWT para acceder a los servicios protegidos.",
    "El usuario debe estar registrado y activo.",
    "1. El usuario ingresa email y contrasena. 2. El sistema valida las credenciales contra la "
    "base de datos. 3. Si las credenciales son correctas, genera un token JWT con los roles y "
    "permisos del usuario. 4. El sistema retorna el token y los datos basicos del usuario.",
    "El usuario obtiene un token JWT valido por 24 horas que permite acceder a los recursos "
    "autorizados segun su rol."
)

pdf.use_case_box(
    "CU-03",
    "Gestion de Catalogo de Productos",
    "Productor",
    "Permite al productor crear, editar y gestionar sus productos ecologicos. Incluye subida de "
    "imagenes, especificacion de ingredientes, datos nutricionales, origen geografico (GPS), "
    "fechas de produccion y vencimiento, y precio.",
    "El productor debe estar autenticado y tener un RUC verificado.",
    "1. El productor accede al panel de gestion de productos. 2. Selecciona 'Nuevo Producto' o "
    "edita uno existente. 3. Completa la informacion del producto: nombre, descripcion, categoria, "
    "precio, stock, imagenes, ingredientes, origen GPS. 4. El sistema registra el producto con "
    "estado 'PENDIENTE' de auditoria. 5. El producto queda visible solo para el productor hasta "
    "que sea auditado y aprobado.",
    "El producto se almacena en la base de datos con estado 'PENDIENTE'. Se notifica al "
    "administrador para su revision y auditoria."
)

pdf.use_case_box(
    "CU-04",
    "Auditoria Quimica de Producto",
    "Administrador",
    "Permite al administrador ejecutar el motor de auditoria química sobre un producto. El sistema "
    "analiza cada ingrediente contra la base de datos de sustancias quimicas prohibidas o "
    "restringidas, calcula un Eco-Score (0-100), genera badges (Eco-Friendly, Libre de Toxicos, "
    "Vegano, etc.) y emite un certificado PDF con hash SHA-256.",
    "El producto debe estar en estado 'PENDIENTE' y tener ingredientes registrados.",
    "1. El administrador selecciona un producto pendiente de auditoria. 2. El sistema analiza "
    "automaticamente cada ingrediente contra la base de datos quimica. 3. Se calcula el Eco-Score "
    "restando puntos por cada sustancia nociva encontrada. 4. Si el Eco-Score >= 70, el producto "
    "es 'APROBADO'; caso contrario, 'RECHAZADO'. 5. El sistema genera un certificado PDF con "
    "los resultados y un hash SHA-256. 6. El producto se actualiza con el estado final.",
    "El producto queda disponible en el catalogo publico si fue aprobado. Se genera un registro "
    "de auditoria inmutable con hash de verificacion."
)

pdf.use_case_box(
    "CU-05",
    "Compra de Productos",
    "Cliente",
    "Permite al cliente agregar productos al carrito, seleccionar metodo de pago y completar "
    "la compra. El sistema soporta pagos locales (Yape, Plin, TuPay) y pagos internacionales "
    "(Stripe).",
    "El cliente debe estar autenticado. Los productos deben estar aprobados y tener stock disponible.",
    "1. El cliente navega el catalogo y agrega productos al carrito. 2. Revisa el carrito y "
    "procede al checkout. 3. Selecciona el metodo de envio. 4. Selecciona el metodo de pago. "
    "5. Para pagos locales (Yape/Plin/TuPay): el sistema genera un codigo de referencia y "
    "simula la confirmacion. 6. Para Stripe: redirige a la pasarela de pago segura. 7. El "
    "sistema confirma el pago y crea la orden. 8. Se actualiza el stock del producto.",
    "Se genera una orden con estado 'CONFIRMADO'. El stock se descuenta atomicamente. "
    "Se envian notificaciones push al productor y al cliente."
)

pdf.use_case_box(
    "CU-06",
    "Ver Catalogo y Filtrar Productos",
    "Cliente (no autenticado), Cliente",
    "Permite a cualquier usuario navegar el catalogo de productos aprobados, aplicar filtros "
    "por categoria, nombre, Eco-Score minimo y ver el detalle de cada producto incluyendo "
    "su certificado de auditoria.",
    "No se requiere autenticacion. Los productos mostrados deben tener estado 'APROBADO'.",
    "1. El usuario accede a la pagina principal. 2. Visualiza los productos destacados. "
    "3. Puede buscar por texto, filtrar por categoria o por Eco-Score minimo. 4. Selecciona "
    "un producto para ver su detalle: descripcion, ingredientes, origen, certificado PDF, "
    "Eco-Score y badges.",
    "El usuario visualiza la informacion completa del producto, incluyendo los resultados "
    "de la auditoria quimica."
)

pdf.use_case_box(
    "CU-07",
    "Gestion de Usuarios",
    "Administrador",
    "Permite al administrador gestionar los usuarios del sistema: activar/desactivar cuentas, "
    "verificar productores (RUC y certificaciones), asignar Eco-Score a usuarios (boost), "
    "y ver el historial de actividades.",
    "El administrador debe estar autenticado con rol ADMIN.",
    "1. El administrador accede al panel de gestion de usuarios. 2. Visualiza la lista de "
    "usuarios con filtros por rol y estado. 3. Selecciona un usuario para ver detalle. "
    "4. Puede activar/desactivar la cuenta, verificar RUC del productor, otorgar certificacion "
    "ecologica, o eliminar la cuenta.",
    "El usuario queda actualizado con los cambios realizados por el administrador."
)

pdf.use_case_box(
    "CU-08",
    "Generacion de Certificado PDF de Auditoria",
    "Administrador, Cliente",
    "Permite generar y descargar el certificado de auditoria quimica de un producto en formato "
    "PDF. El certificado incluye: Eco-Score, lista de ingredientes analizados, nivel de riesgo "
    "de cada ingrediente, badges obtenidos, estado final (APROBADO/RECHAZADO), y un hash "
    "SHA-256 que garantiza la integridad del documento.",
    "El producto debe haber sido auditado previamente por el administrador.",
    "1. El administrador (o cliente via visualizacion) solicita el certificado de un producto "
    "auditado. 2. El sistema consulta los resultados de la auditoria almacenados. 3. Genera "
    "un PDF con formato profesional: logo de EcoMarket, datos del producto, tabla de "
    "ingredientes con riesgos, Eco-Score visual, badges y hash SHA-256.",
    "Se obtiene un documento PDF con hash SHA-256 que certifica los resultados de la auditoria "
    "quimica del producto."
)

pdf.use_case_box(
    "CU-09",
    "Dashboard de Ventas y Estadisticas",
    "Productor, Administrador",
    "Proporciona una vista de panel con graficos y estadisticas de ventas, productos mas "
    "vendidos, ingresos por periodo y metricas de auditoria. El productor ve solo sus "
    "datos; el administrador ve datos globales.",
    "El usuario debe estar autenticado con rol PRODUCTOR o ADMIN.",
    "1. El usuario accede al dashboard. 2. Visualiza graficos de ventas (diario, semanal, "
    "mensual). 3. Revisa productos mas vendidos, ingresos totales y comisiones. 4. El "
    "administrador puede ver metricas globales: total de usuarios, productos auditados, "
    "tasa de aprobacion/rechazo, ingresos totales del sistema.",
    "El usuario obtiene una vision clara del rendimiento de ventas y operaciones."
)

pdf.use_case_box(
    "CU-10",
    "Notificaciones Push",
    "Sistema (automatico), Productor, Cliente",
    "El sistema envia notificaciones push automaticas a los usuarios ante eventos importantes: "
    "confirmacion de pago, cambio de estado de producto, resultado de auditoria, actualizacion "
    "de pedido.",
    "El usuario debe tener notificaciones habilitadas.",
    "1. Ocurre un evento relevante (pago confirmado, producto auditado, etc.). 2. El sistema "
    "prepara la notificacion con titulo, cuerpo y datos adicionales. 3. La notificacion se "
    "envia al usuario destino. 4. El usuario recibe la notificacion en la plataforma.",
    "El usuario es notificado del evento en tiempo real, mejorando la experiencia de uso "
    "y la respuesta a eventos importantes."
)

# ──────────────────────────────────────────────────────────
# 4. GLOSARIO
# ──────────────────────────────────────────────────────────
pdf.add_page()
pdf.chapter_title("4", "Glosario de Terminos")

glosario = [
    ("Eco-Score", "Puntuacion numerica del 0 al 100 que indica el nivel de pureza ecologica de un producto. "
     "Se calcula restando puntos por cada ingrediente nocivo detectado en la auditoria quimica. "
     "Un puntaje >= 70 permite la aprobacion del producto."),
    ("Badge", "Insignia o distintivo visual que se otorga al producto segun los resultados de la auditoria. "
     "Los badges disponibles son: Eco-Friendly, Toxic-Free, Vegan, Cruelty Free y Plastic Free."),
    ("Auditoria Quimica", "Proceso automatizado mediante IA que analiza los ingredientes de un producto "
     "contra una base de datos de sustancias quimicas prohibidas o restringidas, evaluando su "
     "impacto en la salud y el medio ambiente."),
    ("JWT (JSON Web Token)", "Token de autenticacion basado en estandares que permite a los usuarios "
     "acceder de forma segura a los servicios de la plataforma sin reenviar credenciales "
     "en cada solicitud."),
    ("Yape / Plin / TuPay", "Metodos de pago movil populares en Peru. Yape es del BCP, Plin es "
     "interbancario y TuPay es una solucion local. EcoMarket los integra para usuarios "
     "que no poseen tarjetas de credito."),
    ("Stripe", "Pasarela de pago internacional que permite a compradores de otros paises adquirir "
     "productos peruanos usando tarjetas de credito/debito internacionales."),
    ("SHA-256", "Algoritmo de hash criptografico de 256 bits utilizado para generar un identificador "
     "unico e inmutable para cada certificado de auditoria."),
    ("RUC", "Registro Unico de Contribuyentes. Numero de identificacion fiscal en Peru que los "
     "productores deben proporcionar para registrarse como vendedores en la plataforma."),
    ("SENASA", "Servicio Nacional de Sanidad Agraria. Entidad peruana que certifica productos "
     "organicos y ecologicos."),
    ("PWA (Progressive Web App)", "Tecnologia que permite que la plataforma web funcione como una "
     "aplicacion movil, incluyendo notificaciones push, acceso offline parcial y capacidad "
     "de instalacion en el dispositivo."),
]

for termino, definicion in glosario:
    pdf.set_x(10)
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_text_color(27, 94, 32)
    pdf.cell(0, 6, termino, new_x="LMARGIN", new_y="NEXT")
    pdf.set_x(10)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(30, 30, 30)
    pdf.multi_cell(190, 5, definicion)
    pdf.ln(3)

# ──────────────────────────────────────────────────────────
# Guardar
# ──────────────────────────────────────────────────────────
output_path = "docs/EcoMarket_Entrevista_y_Casos_de_Uso.pdf"
pdf.output(output_path)
print(f"PDF generado exitosamente: {output_path}")
print(f"Total de paginas: {pdf.page_no()}")
