import pathlib
import json
from itertools import product
from random import choice
from peewee import IntegrityError, OperationalError
from .models.company import CompanyCategory, Company, CompanyRecord
from .models.lottery import LotterySlot, LotteryRecord

from .instance import database_instance


def seed_lottery():
    date_options = ("2025-09-06", "2025-09-07")
    time_options = ("13:50:00", "15:50:00", "17:50:00")

    try:
        with database_instance:
            database_instance.drop_tables([LotterySlot])
            database_instance.create_tables([LotterySlot, LotteryRecord])

        for date, time in product(date_options, time_options):
            LotterySlot.create(date=date, time=time)

    except IntegrityError:
        print("Slots data already exists")


def seed_companies():
    def get_data():
        try:
            data_path = pathlib.Path(__file__).resolve().parents[2] / "data.json"
            with data_path.open(encoding="utf8") as data_file:
                return json.load(data_file)
        except Exception as e:
            print(e)
            return {}

    with database_instance:
        database_instance.create_tables(
            [
                CompanyCategory,
                Company,
                CompanyRecord,
            ]
        )

    data = get_data()

    try:
        for category in data:
            row_category = CompanyCategory.create(
                id=category["id"], name=category["category"]
            )

            Company.bulk_create(
                (
                    Company(
                        id=item["id"],
                        name=item["title"],
                        contacts=item["contacts"],
                        description="Принимая во внимание показатели успешности, глубокий уровень погружения обеспечивает широкому кругу (специалистов) участие в формировании анализа существующих паттернов поведения. Задача организации, в особенности же высококачественный прототип будущего проекта говорит о возможностях своевременного выполнения сверхзадачи. В своём стремлении повысить качество жизни, они забывают, что дальнейшее развитие различных форм деятельности создаёт предпосылки для системы обучения кадров, соответствующей насущным потребностям.",
                        category=row_category,
                    )
                    for item in category["items"]
                )
            )
    except IntegrityError:
        print("Companies data already exists")


def seed_lottery_records():
    date_options = ("2025-09-08", "2025-09-09")
    time_options = ("13:50:00", "15:50:00", "17:50:00")

    try:
        for ix in range(20):
            username = f"testuser_{ix}"
            date = choice(date_options)
            time = choice(time_options)
            first_name = "testuser"
            last_name = str(ix)
            phone_number = ""
            LotteryRecord.add(username, date, time, first_name, last_name, phone_number)

    except IntegrityError:
        print("Lottery records already exists")


seed_lottery()
seed_companies()
seed_lottery_records()
