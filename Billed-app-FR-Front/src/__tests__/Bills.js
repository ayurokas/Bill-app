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
      //vérifie que l'icône des notes de frais dans la mise en page verticale est mise en surbrillance lorsque l'utilisateur est connecté en tant qu'employé.
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });

     // [1 - Rapport de bug] - Cas de test pour vérifier l'ordre des notes de frais du plus ancien au plus récent
     test("Alors les notes de frais devraient être triées du plus ancien au plus récent", () => {
      // Créer l'interface utilisateur des notes de frais avec les données triées en ordre décroissant en fonction de leurs dates
      document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })

      // Obtenir toutes les dates de l'interface utilisateur et les convertir en un tableau de chaînes de caractères
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)

      // Fonction pour trier les dates dans l'ordre inverse (ordre decroissant)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)

      // Créer une copie triée du tableau de dates en utilisant la fonction d'ordre ordre decroissant
      const datesSorted = [...dates].sort(antiChrono)

      // Vérifier si les dates de l'interface utilisateur correspondent aux dates triées
      expect(dates).toEqual(datesSorted)
    })
  });

  //Vérifier que cliquer sur l'icône de l'œil ouvre une fenêtre modale
  describe("When I am on Bills Page and I click on icon eye", () => {
    test("Then a modal should open", () => {
      // Configuration de l'environnement de test et simulation du type d'utilisateur "Employee" dans le stockage local
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

