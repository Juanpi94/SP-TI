from time import sleep
from typing import Callable

from django.contrib.auth.models import User
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.core.management import call_command
from django.core.exceptions import ObjectDoesNotExist
from selenium.webdriver import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.webdriver import WebDriver
from selenium.webdriver.support.wait import WebDriverWait
from selenium.common.exceptions import TimeoutException

from backend.models import Activos_Plaqueados


class StaticSeleniumLiveServerTestCase(StaticLiveServerTestCase):
    selenium: WebDriver = None

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        edge_options = Options()
        edge_options.add_argument("--remote-allow-origins=*")
        cls.selenium = WebDriver(options=edge_options)
        cls.selenium.implicitly_wait(10)

    @classmethod
    def tearDownClass(cls):
        cls.selenium.quit()
        super().tearDownClass()

    def create_user(self):
        admin_pass = "AdminPassword"
        admin_user = "admin"

        if User.objects.filter(username=admin_user).count() > 0:
            return [admin_user, admin_pass]
        User.objects.create_user(username=admin_user, password=admin_pass, email="admin@admin.com", is_superuser=True)
        return [admin_user, admin_pass]

    def login(self):
        [admin_user, admin_pass] = self.create_user()

        self.selenium.get(self.live_server_url)
        username_input = self.selenium.find_element(By.ID, "id_username")
        password_input = self.selenium.find_element(By.ID, "id_password")
        submit_input = self.selenium.find_element(By.CSS_SELECTOR, "[type=submit]")
        username_input.send_keys(admin_user)
        password_input.send_keys(admin_pass)
        submit_input.click()
        self.selenium.implicitly_wait(5)

    def log_test(self):
        print("----running test----")
        print(self._testMethodName)
        print(self.id())

    def log_end_test(self):
        print("----End {0} test----".format(self._testMethodName))


class LoginTest(StaticSeleniumLiveServerTestCase):
    def test_login(self):
        """Test login functionality"""
        self.log_test()
        self.login()
        self.assertEqual(f"{self.live_server_url}/plaqueados/", self.selenium.current_url,
                         msg="No se consiguió ingresar")

    def tearDown(self) -> None:
        self.log_end_test()


class TableTest(StaticSeleniumLiveServerTestCase):
    test_record = {
        "nombre": "Pantalla Led",
        "observacion": "Plaqueado del 15 de julio",
        "marca": "Samsung",
        "valor": "500$",
        "modelo": "OLED",
        "serie": "15r235",
        "garantia": "19/05/2024",
        "fecha_ingreso": "18/04/2023",
        "ubicacion": "164",
        "tipo": "9",
        "subtipo": "6",
        "placa": "123test",
    }

    def setUp(self) -> None:
        self.log_test()
        call_command("seed", "--flush", "--silent")
        self.login()

    def tearDown(self) -> None:
        self.log_end_test()
        print("\n")

    def test_add(self):
        add_btn = self.selenium.find_element(By.CSS_SELECTOR, "[data-atic-action=add]")
        add_btn.click()

        for key, value in self.test_record.items():
            form_input = self.selenium.find_element(By.ID, f"id_{key}")
            input_type = form_input.get_attribute("type")
            if input_type == "text" or input_type == "date":
                form_input.send_keys(value)
            else:
                if form_input.find_element(By.XPATH, "..") is not None:
                    parent_select = form_input.find_element(By.XPATH, "..").find_element(By.XPATH, "..")
                    parent_select.click()
                    choice = parent_select.find_element(By.ID, f"choices--id_{key}-item-choice-3")
                    ActionChains(self.selenium).click(choice).perform()

        submit_btn = self.selenium.find_element(By.ID, "add-form-btn")

        submit_btn.click()
        try:
            el = WebDriverWait(self.selenium, 12).until(
                lambda d: d.find_element(By.XPATH, f"//div[text()='{self.test_record.get('nombre')}']"))
            qs = Activos_Plaqueados.objects.filter(nombre__exact=self.test_record.get("nombre"))
            self.assertGreater(qs.count(), 0, msg="The record was not added to the database")

        except TimeoutException:
            self.fail("The added record was not added to the table")

    def test_delete(self):
        delete_btn = self.selenium.find_element(By.CSS_SELECTOR, "[data-atic-action=delete]")
        record_id = delete_btn.get_attribute("data-atic-record_id")

        delete_btn.click()

        confirmation_btn = self.selenium.find_element(By.CLASS_NAME, "swal2-confirm")
        confirmation_btn.click()
        try:
            WebDriverWait(self.selenium, 10).until_not(
                lambda d: d.find_element(By.CSS_SELECTOR, f"[data-atic-record_id='{record_id}']"))
        except TimeoutException:
            self.fail("Element was not deleted from table")

        qs = Activos_Plaqueados.objects.filter(id=record_id)

        self.assertEqual(qs.count(), 0, "Record still exists even after deletion")

    def test_edit(self):
        pass
