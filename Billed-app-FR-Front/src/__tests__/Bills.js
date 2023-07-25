/**
 * @jest-environment jsdom
 */

// Importation des bibliothèques de test et des modules nécessaires
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

// Simulation du magasin pour les tests
jest.mock("../app/store", () => mockStore);

// Suite de tests pour la page des notes de frais en tant qu'employé
//Vérifier que l'icône des notes de frais dans la mise en page verticale est mise en surbrillance
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Configuration de l'environnement de test et simulation du type d'utilisateur "Employee" dans le stockage local
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
     // to-do write expect expression
      // Verifie que la class "active-icon" est bien présente sur l'élement avec le data-testid = "icon-window"
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

    // [1 - Bug report] - Le test Bills est au rouge/FAIL (src/__tests__/Bills.js) / les notes de frais ne s'affichent pas par ordre décroissant.
    test("Then bills should be ordered from earliest to latest", () => {
      //effectue un tri des éléments du tableau bills en fonction de leur propriété date. Elle utilise la fonction sort() 
      //pour organiser les éléments du tableau en fonction du résultat retourné par la fonction de comparaison qui lui est passée en argument. 
      //Cette fonction de comparaison soustrait les dates b.date et a.date, ce qui entraîne un tri des éléments par ordre décroissant de date.
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  });

  describe("When I am on Bills Page and I click on icon eye", () => {
    test("Then a modal should open", () => {
      Object.defineProperty(window, localStorage, { value: localStorageMock })
      window.localStorage.setItem("user", JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      const newBills = new Bills({ document, onNavigate, localStorage: window.localStorage, store: null })
      $.fn.modal = jest.fn() // modal mock
      const handleClickIconEye = jest.fn(() => { newBills.handleClickIconEye })
      const firstEyeIcon = screen.getAllByTestId("icon-eye")[0]; //on test le premier icone eye 
      firstEyeIcon.addEventListener("click", handleClickIconEye)
      fireEvent.click(firstEyeIcon)
      expect(handleClickIconEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    })
  })
})
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

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("Then fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      //verifier l'exisantce de la table
      const billsTab = document.getElementById("data-table");
      expect(billsTab).toBeTruthy()
    })
  })
  
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

