import os
import psycopg2
import sys
from dotenv import load_dotenv
import glob

# Charger les variables d'environnement depuis le fichier .env du backend
load_dotenv(os.path.join('suna', 'backend', '.env'))

# Récupérer les informations de connexion à partir des variables d'environnement
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')

# Construire l'URL de connexion PostgreSQL à partir de l'URL Supabase
# Format typique d'une URL Supabase: https://frcrxgzcuiitijbezofx.supabase.co
# Nous devons la transformer en: postgresql://postgres:[PASSWORD]@db.frcrxgzcuiitijbezofx.supabase.co:5432/postgres

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Erreur: SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurés dans le fichier .env")
    sys.exit(1)

# Extraire le nom d'hôte de l'URL Supabase
host = SUPABASE_URL.replace('https://', '')
host = host.split('.')[0]  # Prendre uniquement la première partie (identifiant du projet)
db_host = f"db.{host}.supabase.co"

print(f"Connexion à la base de données Supabase {db_host}...")

try:
    # Connexion à la base de données
    conn = psycopg2.connect(
        host=db_host,
        port=5432,
        dbname="postgres",
        user="postgres",
        password=SUPABASE_SERVICE_ROLE_KEY  # Le mot de passe est la clé de service
    )
    
    # Créer un curseur et activer le mode autocommit
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Connexion réussie à la base de données Supabase.")
    
    # Création du schéma basejump
    print("Création du schéma basejump...")
    cur.execute("CREATE SCHEMA IF NOT EXISTS basejump;")
    print("Schéma basejump créé avec succès.")
    
    # Dossier contenant les scripts SQL de migration
    migrations_dir = os.path.join('suna', 'backend', 'supabase', 'migrations')
    
    # Vérifier si le répertoire existe
    if not os.path.exists(migrations_dir):
        print(f"Erreur: Le répertoire des migrations {migrations_dir} n'existe pas.")
        sys.exit(1)
    
    # Lister tous les fichiers SQL dans le répertoire des migrations
    sql_files = sorted(glob.glob(os.path.join(migrations_dir, '*.sql')))
    
    if not sql_files:
        print(f"Aucun fichier SQL trouvé dans {migrations_dir}.")
        sys.exit(1)
    
    print(f"Exécution de {len(sql_files)} scripts SQL de migration...")
    
    # Exécuter chaque script SQL
    for sql_file in sql_files:
        print(f"Exécution de {os.path.basename(sql_file)}...")
        with open(sql_file, 'r') as f:
            sql_script = f.read()
            try:
                cur.execute(sql_script)
                print(f"  Script {os.path.basename(sql_file)} exécuté avec succès.")
            except Exception as e:
                print(f"  Erreur lors de l'exécution de {os.path.basename(sql_file)}: {str(e)}")
                # Continuer avec le fichier suivant
    
    # Vérifier que le schéma a été créé correctement
    cur.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'basejump';")
    if cur.fetchone():
        print("\nLe schéma basejump existe maintenant dans la base de données.")
    else:
        print("\nAttention: Le schéma basejump n'a pas été trouvé après la création.")
    
    # Vérifier les tables créées dans le schéma basejump
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'basejump';")
    tables = cur.fetchall()
    if tables:
        print("\nTables dans le schéma basejump:")
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("\nAucune table n'a été trouvée dans le schéma basejump.")
        
except Exception as e:
    print(f"Erreur: {str(e)}")
    sys.exit(1)
finally:
    # Fermer la connexion
    if 'conn' in locals() and conn is not None:
        conn.close()
        print("\nConnexion à la base de données fermée.")