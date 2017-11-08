import React, { Component } from 'react';
import './App.css';
import ReactFileReader from 'react-file-reader';


class App extends Component {
  
  constructor() {
    super();

    this.state = {
      loans: [],
      showException1: true,
      showException2: true,
      showException3: true,
      showException4: true,
      showPerfect: true,
      sortBy: "idASC"
    }

  }


  handleFileUpload(files) {
    console.log("Reading file...");

    let reader = new FileReader();
    let _this = this;

    reader.onload = function(e) {
      const Papa = require("papaparse/papaparse.min.js");
      let result = Papa.parse(reader.result, {header: true});
      _this.setState({
        loans: result.data
      });
    }
    
    reader.readAsText(files[0]);

    console.log("done!");
  }

  evaluateLoan(loan) {
    const CMS                   = parseFloat(loan["CMS"]);
    const completionDate        = parseFloat(loan["Completion Date"]);
    const currentIndex          = loan["Current Index"];
    const currentInterestRate   = parseFloat(loan["Current Interest Rate"]);
    const currentLTV            = parseFloat(loan["Current LTV"]);
    const currentMargin         = parseFloat(loan["Current Margin"]);
    const fitchProductCategory  = loan["Fitch Product Category"];
    const incomeBorrower1       = parseFloat(loan["Income Borrower 1"]);
    const incomeBorrower2       = parseFloat(loan["Income Borrower 2"]);
    const maturityDate          = parseFloat(loan["Maturity Date"]);
    const originalLTV           = parseFloat(loan["Original LTV"]);
    const totalMonthlyIncome    = parseFloat(((incomeBorrower1 + incomeBorrower2) / 12));

    // const { exceptionCosts }    = this.state;

    let exceptionCosts  = {};
    exceptionCosts[1]   = {};
    exceptionCosts[2]   = {};
    exceptionCosts[3]   = {};
    exceptionCosts[4]   = {};
    exceptionCosts[4]["<10"] = {};
    exceptionCosts[4]["10-20"] = {};
    exceptionCosts[4]["20-30"] = {};
    exceptionCosts[4]["30-50"] = {};
    exceptionCosts[4][">50"] = {};

    exceptionCosts[1]["U"] = 4;
    exceptionCosts[1]["P"] = 4;
    exceptionCosts[1]["N"] = 4;
    exceptionCosts[1]["L"] = 4;
    exceptionCosts[1]["M"] = 4;
    exceptionCosts[1]["B"] = 4;

    exceptionCosts[2]["U"] = 1;
    exceptionCosts[2]["P"] = 1;
    exceptionCosts[2]["N"] = 1;
    exceptionCosts[2]["L"] = 2;
    exceptionCosts[2]["M"] = 2;
    exceptionCosts[2]["B"] = 3;

    exceptionCosts[3]["U"] = 0;
    exceptionCosts[3]["P"] = 2;
    exceptionCosts[3]["N"] = 4;
    exceptionCosts[3]["L"] = 6;
    exceptionCosts[3]["M"] = 8;
    exceptionCosts[3]["B"] = 10;

    exceptionCosts[4]["<10"]["U"] = 0;
    exceptionCosts[4]["10-20"]["U"] = 0;
    exceptionCosts[4]["20-30"]["U"] = 1;
    exceptionCosts[4]["30-50"]["U"] = 3;
    exceptionCosts[4][">50"]["U"] = 10;

    exceptionCosts[4]["<10"]["P"] = 2;
    exceptionCosts[4]["10-20"]["P"] = 3;
    exceptionCosts[4]["20-30"]["P"] = 5;
    exceptionCosts[4]["30-50"]["P"] = 12;
    exceptionCosts[4][">50"]["P"] = 20;

    exceptionCosts[4]["<10"]["N"] = 4;
    exceptionCosts[4]["10-20"]["N"] = 6;
    exceptionCosts[4]["20-30"]["N"] = 9;
    exceptionCosts[4]["30-50"]["N"] = 20;
    exceptionCosts[4][">50"]["N"] = 40;

    exceptionCosts[4]["<10"]["L"] = 6;
    exceptionCosts[4]["10-20"]["L"] = 10;
    exceptionCosts[4]["20-30"]["L"] = 14;
    exceptionCosts[4]["30-50"]["L"] = 30;
    exceptionCosts[4][">50"]["L"] = 50;

    exceptionCosts[4]["<10"]["M"] = 8;
    exceptionCosts[4]["10-20"]["M"] = 13;
    exceptionCosts[4]["20-30"]["M"] = 21;
    exceptionCosts[4]["30-50"]["M"] = 40;
    exceptionCosts[4][">50"]["M"] = 60;

    exceptionCosts[4]["<10"]["B"] = 10;
    exceptionCosts[4]["10-20"]["B"] = 20;
    exceptionCosts[4]["20-30"]["B"] = 30;
    exceptionCosts[4]["30-50"]["B"] = 50;
    exceptionCosts[4][">50"]["B"] = 80;



    let grade = 100;
    let exceptions = [];



    // Exception 1: Check Maturity vs. Completion dates
    if (maturityDate < completionDate) { 
      exceptions.push(1);
      grade -= exceptionCosts[1][fitchProductCategory];
    }

    // Exception 2: Current Index AND Margin issues
    if ( (currentIndex === "FIX") && (currentMargin !== currentInterestRate) ) {
      exceptions.push(2);
      grade -= exceptionCosts[2][fitchProductCategory];
    }

    // Exception 3: Check Current vs. Original LTV
    if (currentLTV > originalLTV) {
      exceptions.push(3);
      grade -= exceptionCosts[3][fitchProductCategory];
    }

    // Exception 4: Check CMS
    if ( CMS > totalMonthlyIncome) {
      exceptions.push(4);
      const difference = CMS - totalMonthlyIncome;
      const percent = (difference / CMS) * 100;

      if (percent <= 10)       { grade -= exceptionCosts[4]["<10"][fitchProductCategory]; }
      else if (percent <= 20)  { grade -= exceptionCosts[4]["10-20"][fitchProductCategory]; }
      else if (percent <= 30)  { grade -= exceptionCosts[4]["20-30"][fitchProductCategory]; }
      else if (percent <= 50)  { grade -= exceptionCosts[4]["30-50"][fitchProductCategory]; }
      else if (percent > 50)   { grade -= exceptionCosts[4][">50"][fitchProductCategory]; }

    }

    loan.grade = grade;
    loan.exceptionIDs = exceptions.join(' | ');

    return loan;
  }

  toggleIDSort() {
    const { sortBy } = this.state;
    let newSortBy = "";

    if (sortBy.includes("id")) {

      if (sortBy.includes("ASC")) {
        newSortBy = "idDESC";
      } else {
        newSortBy = "idASC";
      }

    } else {
      newSortBy = "idASC";
    }

    this.setState({
      sortBy: newSortBy
    })
  }

  toggleGradeSort() {
    const { sortBy } = this.state;
    let newSortBy = "";

    if (sortBy.includes("grade")) {

      if (sortBy.includes("ASC")) {
        newSortBy = "gradeDESC";
      } else {
        newSortBy = "gradeASC";
      }

    } else {
      newSortBy = "gradeASC";
    }

    this.setState({
      sortBy: newSortBy
    })
  }

  toggleShowException(exceptionNumber) {
    const {showException1, showException2, showException3, showException4} = this.state;

    switch(exceptionNumber) {
      case 1:
        this.setState({
          showException1: !showException1
        });
      break;

      case 2:
        this.setState({
          showException2: !showException2
        });
      break;

      case 3:
        this.setState({
          showException3: !showException3
        });
      break;

      case 4:
        this.setState({
          showException4: !showException4
        });
      break;

      default:
      break;
    }
  }

  toggleShowPerfect() {
    const { showPerfect } = this.state;
    let newShowPerfect;

    if (showPerfect) {
      newShowPerfect = false;
    } else {
      newShowPerfect = true;
    }

    this.setState({
      showPerfect: newShowPerfect
    })
  }

  render() {
    
    const { 
      showException1,
      showException2,
      showException3,
      showException4, 
      showPerfect,
      sortBy,
    } = this.state;

    let { loans } = this.state; 
    let loansShown = loans.length

    // Loans need to be evaluated prior to JSX render to enable sorting/filtering
    for (var i = loans.length - 1; i >= 0; i--) {
      loans[i] = this.evaluateLoan(loans[i]);
    }


    // Filters
    if (sortBy === "idASC") {
      loans = loans.sort(function(a,b) {
        return a['Loan ID'] - b['Loan ID'];
      });

    } else if (sortBy === "idDESC") {
      loans = loans.sort(function(a,b) {
        return b['Loan ID'] - a['Loan ID'];
      });
    }

    else if (sortBy === "gradeASC") {
      loans = loans.sort(function(a,b) {
        return a.grade - b.grade;
      });

    } else if (sortBy === "gradeDESC") {
      loans = loans.sort(function(a,b) {
        return b.grade - a.grade;
      });
    }
    // END Filters




    // Construct a table row for each Loan, and make hidden when filtered out
    const loanList = loans.map(function(loan) {

      let hide = false;

      if (!showPerfect && loan.grade === 100) { hide = true; }
      if (!showException1 && loan.exceptionIDs.includes("1")) { hide = true; }
      if (!showException2 && loan.exceptionIDs.includes("2")) { hide = true; }
      if (!showException3 && loan.exceptionIDs.includes("3")) { hide = true; }
      if (!showException4 && loan.exceptionIDs.includes("4")) { hide = true; }

      if (hide) { loansShown--; } 

      return(
        <tr className={hide ? "hidden" : ""} key={loan['Loan ID'] + loan['Data Extract Date']}>
          <td>{loan["Loan ID"]}</td>
          <td>{loan.grade}</td>
          <td>{loan.exceptionIDs}</td>
        </tr>
      );
    }, this);

    return (
      <div className="App container">
        <ReactFileReader handleFiles={this.handleFileUpload.bind(this)} fileTypes={'.csv'}>
          <button className='btn btn-primary'>Upload CSV</button>
        </ReactFileReader>
        
        <div className="filters">
          <p>Filters:</p>
          <input type="checkbox" onChange={this.toggleShowPerfect.bind(this)} checked={showPerfect}></input><label> Show Perfect Loans</label>
          <input type="checkbox" onChange={this.toggleShowException.bind(this, 1)} checked={showException1}></input><label> Show Loans with Exception 1</label>
          <input type="checkbox" onChange={this.toggleShowException.bind(this, 2)} checked={showException2}></input><label> Show Loans with Exception 2</label>
          <input type="checkbox" onChange={this.toggleShowException.bind(this, 3)} checked={showException3}></input><label> Show Loans with Exception 3</label>
          <input type="checkbox" onChange={this.toggleShowException.bind(this, 4)} checked={showException4}></input><label> Show Loans with Exception 4</label>
        </div>

        <div className="loan-counter">
          <p className="loan-count">(Showing {loansShown} loans out of {loans.length}).</p>          
        </div>

        <table className="table table-responsive">
          <thead>
            <tr>
              <th onClick={this.toggleIDSort.bind(this)}>
                <a className="sortlink sortlink__id">
                ID&nbsp;
                {(sortBy === "idASC") ? <span className="glyphicon glyphicon-chevron-down"></span> : null }
                {(sortBy === "idDESC") ? <span className="glyphicon glyphicon-chevron-up"></span> : null }
                </a>
              </th>
              
              <th onClick={this.toggleGradeSort.bind(this)}>
                <a className="sortlink sortlink__grade">
                 Grade&nbsp;
                {(sortBy === "gradeASC") ? <span className="glyphicon glyphicon-chevron-down"></span> : null }
                {(sortBy === "gradeDESC") ? <span className="glyphicon glyphicon-chevron-up"></span> : null }
                </a>
              </th>
              
              <th>Exception(s)</th>
            </tr>
          </thead>
          <tbody>
            {loanList}
          </tbody>
        </table>
      </div>
    );
  }
}

export default App;
