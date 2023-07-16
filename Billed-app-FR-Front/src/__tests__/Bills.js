/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"


import router from "../app/Router.js";
import Bills from "../containers/Bills.js";
jest.mock("../app/store", () => mockStore)
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    //test backend
    describe('When I am on Bills page but back-end send an error message', () => {
      test('Then, Error page should be rendered', () => {
        document.body.innerHTML = BillsUI({ error: 'some error message' })
        expect(screen.getAllByText('Erreur')).toBeTruthy()
      })
    })
    //tester le loader 
    describe('When I am on bills page  but it is loading', () => {
      test('Then, Loading page should be rendered', () => {
        document.body.innerHTML = BillsUI({ loading: true })
        expect(screen.getAllByText('Loading...')).toBeTruthy()
      })
    })
    describe("When I am on Bills Page", () => {

      test("Then bill icon in vertical layout should be highlighted", async () => {

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        //tester l'icone window
        await waitFor(() => screen.getByTestId('icon-window'))
        const windowIcon = screen.getByTestId('icon-window')
        expect(windowIcon.classList.contains("active-icon")).toBeTruthy();//verifier la classe active-icon

      })
      //sorter les element du tableau note de frais par rapport a leur date d'une maniere decroissante
      //tester la date 
      test("Then bills should be ordered from earliest to latest", () => {
        document.body.innerHTML = BillsUI({ data: bills.sort((a, b) => new Date(b.date) - new Date(a.date)) })
        const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
        const antiChrono = (a, b) => ((a < b) ? 1 : -1)
        const datesSorted = [...dates].sort(antiChrono)
        expect(dates).toEqual(datesSorted)
      })
      //tester le bouton nouvelle note de frais
      test("The button  add a new bill must be diplayed", () => {

        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
        document.body.innerHTML = BillsUI({ data: bills })
        const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
        const newBills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
        const addBillsButton = screen.getByTestId("btn-new-bill");
        expect(addBillsButton).toBeTruthy();

      })
    })


  })

  //tester l'appel de la fonction en cliquant sur  le bouton
  describe("When I click on new bill button", () => {
    test("Then I should be sent on the new bill page", () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      const newBills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage })
      const btnNewBill = screen.getByTestId('btn-new-bill')
      const handleClickNewBill = jest.fn(newBills.handleClickNewBill) //spy sur la focnction handlecLICK une mock function
      btnNewBill.addEventListener('click', handleClickNewBill)
      fireEvent.click(btnNewBill)
      expect(handleClickNewBill).toHaveBeenCalled()
    })


  })

  // test d'intégration GET
  describe("Given I am a user connected as an employee", () => {

    test("fetches bills from mock API GET", async () => {
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

  describe("Given I am a user connected as an employee", () => {

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "a@a"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })

  })
})
