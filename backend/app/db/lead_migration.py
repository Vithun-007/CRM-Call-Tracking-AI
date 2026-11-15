from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def migrate_lead_management_columns(engine: Engine) -> None:
    """Safely add lead management fields to an existing SQLite database."""

    inspector = inspect(engine)

    if "leads" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"]
        for column in inspector.get_columns("leads")
    }

    migrations = {
        "status": "ALTER TABLE leads ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'New'",
        "priority": "ALTER TABLE leads ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'Medium'",
        "follow_up_date": "ALTER TABLE leads ADD COLUMN follow_up_date DATE",
        "lead_notes": "ALTER TABLE leads ADD COLUMN lead_notes TEXT",
    }

    with engine.begin() as connection:
        for column_name, statement in migrations.items():
            if column_name not in existing_columns:
                connection.execute(text(statement))
                print(f"Added leads.{column_name}")
            else:
                print(f"Skipped leads.{column_name}: already exists")

    print("Lead management migration completed.")