/**
 * @jest-environment jsdom
 */

import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then I upload a file with valid extension (jpg, jpeg, png)", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(["test-valid-extension.jpg"], "test-valid-extension.jpg", {
              type: "image/jpg",
            }),
          ],
        },
      });

      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].type).toBe("image/jpg");
    });

    test("Then I upload a file with invalid extension", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      window.alert = jest.fn();
      const handleChangeFile = jest.fn(newBill.handleChangeFile);
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: {
          files: [
            new File(
              ["test-invalid-extension.gif"],
              "test-invalid-extension.gif",
              { type: "image/gif" }
            ),
          ],
        },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].type).toBe("image/gif");

      expect(window.alert).toHaveBeenCalled();
      expect(inputFile.value).toBe("");
    });
  });
  describe("When I am on NewBill Page and I submit the New Bill form", () => {
    test("Then It should call handleSubmit method", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const html = NewBillUI();
      document.body.innerHTML = html;

      const newBill = new NewBill({
        document,
        onNavigate,
        mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmitMethode = jest.fn(newBill.handleSubmit);
      const formNewBill = screen.getByTestId("form-new-bill");
      formNewBill.addEventListener("submit", handleSubmitMethode);
      fireEvent.submit(formNewBill);
      expect(handleSubmitMethode).toHaveBeenCalled();
    });
  });
});

// test d'intégration POST
describe("Given I am a user connected as an employee", () => {
  describe("When I create a new bill", () => {
    test("Then it should fetches new bill to mock API POST and redirected me to Bills Page", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();

      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.resolve();
          },
        };
      });

      window.onNavigate(ROUTES_PATH.NewBill);
      await new Promise(process.nextTick);
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();
    });
  });
  describe("When I create a new bill and an error occurs on API", () => {
    beforeEach(() => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
  
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills = jest.fn().mockReturnValue({
        list: () => Promise.reject(new Error("Erreur 404"))
      });
  
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
  
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });
  
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills = jest.fn().mockReturnValue({
        list: () => Promise.reject(new Error("Erreur 500"))
      });
  
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
  
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});