document.addEventListener("DOMContentLoaded", function () {
  const authorizedDomains = ["www.rosenblumlawlv.com", "rosenblumlawlv.com"];
  const currentHostname = window.location.hostname;
  const isAuthorized =
    authorizedDomains.includes(currentHostname) ||
    currentHostname.endsWith(".csb.app");

  if (!isAuthorized) {
    window.calculateNevadaChildSupport = function () {
      const resultsDiv = document.getElementById("child-support-results");
      if (resultsDiv) {
        resultsDiv.style.display = "block";
        resultsDiv.innerHTML = `
                  <p style="color: red; font-weight: bold;">Error: Calculator failed to load.</p>
                  <p style="font-size: 12px; color: #777;">This tool is licensed for use on <a href="https://www.rosenblumlawlv.com/">rosenblumlawlv.com</a> only.</p>
              `;
      }
    };

    return;
  }
  const parentA_nights_input = document.getElementById("parentA_nights");
  const parentB_nights_input = document.getElementById("parentB_nights");

  function updateParentB_Nights() {
    const nightsA = parseInt(parentA_nights_input.value, 10);
    if (!isNaN(nightsA) && nightsA >= 0 && nightsA <= 365) {
      parentB_nights_input.value = 365 - nightsA;
    } else if (parentA_nights_input.value === "") {
      parentB_nights_input.value = "";
    }
  }

  function updateParentA_Nights() {
    const nightsB = parseInt(parentB_nights_input.value, 10);
    if (!isNaN(nightsB) && nightsB >= 0 && nightsB <= 365) {
      parentA_nights_input.value = 365 - nightsB;
    } else if (parentB_nights_input.value === "") {
      parentA_nights_input.value = "";
    }
  }

  parentA_nights_input.addEventListener("input", updateParentB_Nights);
  parentB_nights_input.addEventListener("input", updateParentA_Nights);

  document.querySelectorAll("details").forEach((detail) => {
    detail.addEventListener("toggle", (event) => {
      const arrow = detail.querySelector("summary span");
      if (detail.open) {
        arrow.style.transform = "rotate(-90deg)";
      } else {
        arrow.style.transform = "rotate(90deg)";
      }
    });
  });
});

// This function implements the tiered model from NAC 425.140.
function getObligation(gmi, numChildren) {
  if (gmi <= 0 || numChildren <= 0) return { amount: 0 };

  let obligation = 0;
  let percentages = [];

  // Define percentages based on number of children
  switch (numChildren) {
    case 1:
      percentages = [0.16, 0.08, 0.04]; // 16%, 8%, 4%
      break;
    case 2:
      percentages = [0.22, 0.11, 0.06]; // 22%, 11%, 6%
      break;
    case 3:
      percentages = [0.26, 0.13, 0.06]; // 26%, 13%, 6%
      break;
    case 4:
      percentages = [0.28, 0.14, 0.07]; // 28%, 14%, 7%
      break;
    default: // 5 or more children
      // Per NAC 425.140(5), add 2%, 1%, 0.5% for each child over 4
      const extraChild = numChildren - 4;
      percentages = [
        0.28 + extraChild * 0.02,
        0.14 + extraChild * 0.01,
        0.07 + extraChild * 0.005,
      ];
      break;
  }

  // Apply tiered calculation
  if (gmi <= 6000) {
    obligation = gmi * percentages[0];
  } else if (gmi <= 10000) {
    obligation = 6000 * percentages[0] + (gmi - 6000) * percentages[1];
  } else {
    obligation =
      6000 * percentages[0] +
      4000 * percentages[1] +
      (gmi - 10000) * percentages[2];
  }

  return {
    amount: obligation,
  };
}

function calculateNevadaChildSupport() {
  const parentA_gmi =
    parseFloat(document.getElementById("parentA_gmi").value) || 0;
  const parentB_gmi =
    parseFloat(document.getElementById("parentB_gmi").value) || 0;
  const parentA_nights =
    parseInt(document.getElementById("parentA_nights").value) || 0;
  const parentB_nights =
    parseInt(document.getElementById("parentB_nights").value) || 0;
  const numChildren =
    parseInt(document.getElementById("num_children").value) || 0;
  const resultsDiv = document.getElementById("child-support-results");

  if (
    parentA_gmi <= 0 ||
    parentB_gmi <= 0 ||
    numChildren <= 0 ||
    Math.round(parentA_nights + parentB_nights) !== 365
  ) {
    alert(
      "Please fill in all fields correctly. Total overnights for both parents must equal 365."
    );
    return;
  }

  let finalObligation = 0;
  let payingParent = "";
  let receivingParent = "";
  let calculationDetails = "";
  let custodyType = "";

  const obligationA = getObligation(parentA_gmi, numChildren).amount;
  const obligationB = getObligation(parentB_gmi, numChildren).amount;

  // Determine Custody Type based on NAC 425.100 (40% rule)
  if (parentA_nights >= 146 && parentB_nights >= 146) {
    custodyType = "Joint Physical Custody";
    if (obligationA > obligationB) {
      finalObligation = obligationA - obligationB;
      payingParent = "Parent A";
      receivingParent = "Parent B";
    } else {
      finalObligation = obligationB - obligationA;
      payingParent = "Parent B";
      receivingParent = "Parent A";
    }
    calculationDetails = `
          <li><strong>Custody Arrangement:</strong> ${custodyType} (${parentA_nights} / ${parentB_nights} nights)</li>
          <li><strong>Parent A's Obligation:</strong> $${obligationA.toFixed(
            2
          )}</li>
          <li><strong>Parent B's Obligation:</strong> $${obligationB.toFixed(
            2
          )}</li>
          <li><strong>Offset Calculation:</strong> The difference is paid by the parent with the higher obligation.</li>
      `;
  } else {
    // Primary Custody
    if (parentA_nights > parentB_nights) {
      custodyType = "Parent A has Primary Custody";
      finalObligation = obligationB;
      payingParent = "Parent B";
      receivingParent = "Parent A";
      calculationDetails = `
              <li><strong>Custody Arrangement:</strong> ${custodyType} (${parentA_nights} / ${parentB_nights} nights)</li>
              <li><strong>Obligor (Non-Custodial):</strong> Parent B</li>
              <li><strong>Parent B's Calculated Obligation:</strong> $${obligationB.toFixed(
                2
              )}</li>
          `;
    } else {
      custodyType = "Parent B has Primary Custody";
      finalObligation = obligationA;
      payingParent = "Parent A";
      receivingParent = "Parent B";
      calculationDetails = `
              <li><strong>Custody Arrangement:</strong> ${custodyType} (${parentA_nights} / ${parentB_nights} nights)</li>
              <li><strong>Obligor (Non-Custodial):</strong> Parent A</li>
              <li><strong>Parent A's Calculated Obligation:</strong> $${obligationA.toFixed(
                2
              )}</li>
          `;
    }
  }

  const ctaHtml = `
      <div style="margin-top: 20px; padding: 15px; background-color: #e6f4ea; border: 1px solid #c3e6cb; border-radius: 5px; text-align: center;">
          <h4 style="margin-top: 0; margin-bottom: 10px; color: #155724; font-weight: 600;">Your Next Step is Crucial</h4>
          <p style="margin: 0 0 15px 0; color: #155724; font-size: 0.95em;">This calculator provides a valuable estimate, but it cannot replace a personalized legal strategy. Call us at <a href="tel:702-433-2889" style="color: #155724;">(702) 433-2889</a> to discuss your case.</p>
          <a href="https://www.rosenblumlawlv.com/contact/" target="_blank" rel="noopener" style="display: inline-block; padding: 10px 20px; font-size: 1em; font-weight: bold; color: #fff; background-color: #c61230; border: none; border-radius: 5px; text-decoration: none; cursor: pointer;">
              Schedule a Confidential Case Evaluation
          </a>
      </div>
      `;

  resultsDiv.style.display = "block";
  resultsDiv.innerHTML = `
  <h3 style="margin-top:0; font-weight: 600;">Estimated Child Support Result</h3>
  <p style="font-size: 1.2em;">Based on the provided figures, <strong>${payingParent}</strong> has an estimated monthly child support obligation of <strong style="color: #FF8000; font-size: 1.3em;">$${finalObligation.toFixed(
    2
  )}</strong>, payable to ${receivingParent}.</p>
  <hr style="border: 0; border-top: 1px solid #cc9966; margin: 15px 0;">
  <h4 style="font-weight: 600;">Calculation Breakdown:</h4>
  <ul style="padding-left: 20px; list-style-type: disc; margin-bottom: 0;">
     ${calculationDetails}
  </ul>
  ${ctaHtml}
`;
}
