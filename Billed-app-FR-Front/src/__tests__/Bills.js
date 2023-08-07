/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// On simule le module "../app/store" en renvoyant mockStore lors des tests.
jest.mock("../app/store", () => mockStore);

// Redéfinit la propriété "localStorage" de l'objet "window" avec une version simulée (localStorageMock).
beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  });
  // Ajoute un utilisateur fictif dans le localStorage pour les tests.
  window.localStorage.setItem(
    "user",
    JSON.stringify({
      type: "Employee",
      email: "a@a",
    })
  );
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const iconWindow = screen.getByTestId("icon-window");

      // to-do write expect expression
      // Verifie que la class "active-icon" est bien présente sur l'élement avec le data-testid = "icon-window"
      expect(iconWindow.classList.contains("active-icon")).toBeTruthy();
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      // Test correspondant au Bug 1
      // [1 - Bug report] - Le test Bills est au rouge/FAIL (src/__tests__/Bills.js) / les notes de frais ne s'affichent pas par ordre décroissant.
      const antiChrono = (a, b) => {return new Date(b.date) - new Date(a.date)}
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    });
  });

  describe("When I am on Bills Page and I click on icon eye", () => {
    test("Then a modal should open", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = BillsUI({ data: bills });

      const allBills = new Bills({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      });

      // Mock - jquery function modal()
      $.fn.modal = jest.fn();

      const firstIconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn(() =>
        allBills.handleClickIconEye(firstIconEye)
      );

      firstIconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(firstIconEye);

      expect(handleClickIconEye).toHaveBeenCalled();

      const modal = screen.getByTestId("modaleFile");
      expect(modal).toBeTruthy();
    });
  });

  describe("When I am on Bills Page and I click on the new bill button", () => {
    test("Then I should be send on the new bill page form", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      document.body.innerHTML = BillsUI({ data: bills });

      const allBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorageMock,
      });

      const handleClickNewBill = jest.fn(() => allBills.handleClickNewBill());

      const btnNewBill = screen.getByTestId("btn-new-bill");
      btnNewBill.addEventListener("click", handleClickNewBill);
      userEvent.click(btnNewBill);
      expect(handleClickNewBill).toHaveBeenCalled();

      const formNewBill = screen.getByTestId("form-new-bill");
      expect(formNewBill).toBeTruthy();
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("Then fetches bills from mock API GET", async () => {
      const storeMethodeSpy = jest.spyOn(mockStore, "bills");

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const headerTitle = screen.getByText("Mes notes de frais");
      expect(headerTitle).toBeTruthy();

      expect(storeMethodeSpy).toHaveBeenCalled();

      const allBillsUI = screen.getAllByTestId("bill-list-item");
      expect(allBillsUI.length).toEqual(4);
    });
  });
  describe("When I navigate to Bills Page and an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const errorMessage = await screen.getByText(/Erreur 404/);
      expect(errorMessage).toBeTruthy();
    });

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const errorMessage = await screen.getByText(/Erreur 500/);
      expect(errorMessage).toBeTruthy();
    });
  });
});
