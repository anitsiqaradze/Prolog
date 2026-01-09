class Prolog {
  #factsList = [];

  set facts(f) {
    this.#factsList.push(...f);
  }
  get facts() {
    return this.#factsList;
  }

  add_entry(input) {
    if (/\s*:-\s*/.test(input)) this.add_rule(input);
    else this.addFact(input);

    console.log(this.#factsList);
  }

  addFact(factString) {
    const parsed = this.parseTerm(factString);
    if (parsed) {
      this.facts.push({
        type: "fact",
        original: factString,
        predicate: parsed.predicate,
        args: parsed.args,
      });
      return true;
    }
    return false;
  }

  query(queryString) {
    const goals = this.parseQuery(queryString);
    if (goals.length === 0) return [];

    // Find all solutions
    return this.solve(goals, {});
  }
  ///// find if atom is uppercase letter or starts with uppercase letter
  isVariable(term) {
    return /^[A-Z_]/.test(term);
  }

  add_rule(rule_string) {
    const match = rule_string.match(/^(.+):-(.+)$/);
    const rule_definition = this.parseQuery(match[2].trim());

    this.#factsList.push({
      type: "rule",
      original: match[0].trim(),
      rule: match[1].trim(),
      rule_definition: rule_definition,
    });
  }

  //////////////////2 to parse single term in fact, predicate, args

  parseTerm(term) {
    const match = term.match(new RegExp(`^(\\w+)\\((.*)\\)$`));

    console.log("parse term ", term, "match", match);

    let fact = match[0];
    let predicate = match[1].trim();
    let args = match[2].split(",").map((a) => a.trim());

    return {
      fact: fact,
      predicate: predicate,
      args: args,
    };
  }

  parseQuery(query) {
    const regex = /(\w+)\(([^)]*)\)/g;

    const goals = [];
    let match;

    while ((match = regex.exec(query)) !== null) {
      goals.push({
        fact: match[0],
        predicate: match[1],
        args: match[2].split(",").map((arg) => arg.trim()),
      });
    }

    return goals;
  }

  // unify(term1, term2, substitution = {}) {
  //   const subst = { ...substitution };

  //   if (this.isVariable(term1) && subst[term1] !== undefined) {
  //     term1 = subst[term1];
  //   }

  //   if (this.isVariable(term2) && subst[term2] !== undefined) {
  //     term2 = subst[term2];
  //   }
  // }

  // solve(goals, substitution) {
  //   if (goals.length === 0) {
  //     return [substitution];
  //   }

  //   const [currentGoal, ...remainingGoals] = goals;

  //   for (const goal of goals) {
  //     let newSubst;
  //     const factGoal = {
  //       fact: goal.fact,
  //       predicate: goal.predicate,
  //       args: goal.args,
  //     };
  //     for (const fact of this.facts) {
  //       // i need to determine if there are variables in goal or not at all if there arent i need to query it
  //       // but first i will pass each to unify method,
  //       //
  //       // check if they are directly equal
  //       if (fact.fact === goal.fact) return true;
  //       else {
  //         newSubst = this.unifyGoals(currentGoal, factGoal, substitution);
  //         console.log(factGoal, "newSubst", newSubst);

  //         if (newSubst) {
  //           console.log(newSubst);
  //           break;
  //         }
  //       }
  //       console.log("new subst", newSubst);
  //       // if (
  //       //   Object.keys(newSubst).length == 0 ||
  //       //   newSubst == undefined ||
  //       //   newSubst == null
  //       // ) {
  //       //   console.log("searched for fact", this.search_for_fact(goal));
  //       // }
  //     }
  //   }
  // }

  solve(goals, substitution) {
    // Base case: no more goals to solve
    if (goals.length === 0) {
      return [substitution];
    }

    const [currentGoal, ...remainingGoals] = goals;
    const solutions = [];

    // Loop through DATABASE FACTS, not goals
    for (const fact of this.facts) {
      const factGoal = {
        fact: fact.fact,
        predicate: fact.predicate,
        args: fact.args,
      };

      // Try to unify current goal with this fact
      const newSubst = this.unifyGoals(currentGoal, factGoal, substitution);

      // console.log(
      //   "Trying to unify:",
      //   currentGoal,
      //   "with",
      //   factGoal,
      //   "result:",
      //   newSubst
      // );

      if (newSubst !== null) {
        // Unification succeeded!

        // Apply substitution to remaining goals
        const substitutedGoals = remainingGoals.map((g) =>
          this.applySubstitution(g, newSubst)
        );

        // Recursively solve remaining goals
        const subSolutions = this.solve(substitutedGoals, newSubst);
        solutions.push(...subSolutions);
      }
    }

    return solutions;
  }

  unify(term1, term2, substitution = {}) {
    // Create a copy to avoid mutating the original
    const subst = { ...substitution };

    // Apply existing substitutions
    if (this.isVariable(term1) && subst[term1] !== undefined) {
      term1 = subst[term1];
    }
    // if (this.isVariable(term2) && subst[term2] !== undefined) {
    //   term2 = subst[term2];
    // }

    // If both are the same, unification succeeds
    if (term1 === term2 || this.isVariable(term2)) {
      return subst;
    }

    // If term1 is a variable, bind it to term2
    if (this.isVariable(term1)) {
      subst[term1] = term2;
      return subst;
    }

    // If term2 is a variable, bind it to term1
    // if (this.isVariable(term2)) {
    //   subst[term2] = term1;
    //   return subst;
    // }

    // Otherwise, unification fails
    return null;
  }

  // Unify two goals (predicates with arguments)
  unifyGoals(goal1, goal2, substitution = {}) {
    // Predicates must match
    if (goal1.predicate !== goal2.predicate) {
      return null;
    }

    // Number of arguments must match
    if (goal1.args.length !== goal2.args.length) {
      return null;
    }

    // Unify each argument pair
    let subst = { ...substitution };
    for (let i = 0; i < goal1.args.length; i++) {
      subst = this.unify(goal1.args[i], goal2.args[i], subst);
      if (subst === null) {
        return null; // Unification failed
      }
    }

    return subst;
  }

  // Add this helper method to apply substitutions to goals
  applySubstitution(goal, substitution) {
    return {
      fact: goal.fact,
      predicate: goal.predicate,
      args: goal.args.map((arg) =>
        this.isVariable(arg) && substitution[arg] !== undefined
          ? substitution[arg]
          : arg
      ),
    };
  }

  search_for_fact(goal) {
    for (let f of this.#factsList) {
      if (f.fact === goal.fact) return true;
    }
    return false;
  }

  // here goal1 is input and goal2 is fact from db
  // unifyGoals(goal1, goal2, substitution) {
  //   if (
  //     goal1.predicate == goal2.predicate &&
  //     goal1.args.length == goal2.args.length
  //   ) {
  //     // check if atom is variable and try to substitute from goal2 which is fact from initial array

  //     let subst = { ...substitution };

  //     for (let i = 0; i < goal1.args.length; i++) {
  //       let term1 = goal1.args[i],
  //         term2 = goal2.args[i];
  //       // for each argument from goal we pass them to unify method
  //       // it compares them and tries to find value for variable from goal

  //       if (!this.isVariable(term1) && term1 !== term2) return null;
  //       else if (this.isVariable(term1)) {
  //         if (term1 != term2 && !subst[term1]) {
  //           subst[term1] = term2;
  //         }
  //       }

  //       // // check if first is variable and actial goals dont match then we substitute
  //       // if (!this.isVariable(goal1[i]) && goal1[i] != goal2[i]) {
  //       //   return null;
  //       // } else if (this.isVariable(goal1[i]) && goal1[i] != goal2[i]) {
  //       // }
  //     }

  //     return subst;
  //   }
  // }
}

let database_facts = [
  { fact: "mother(tamari,ani)", predicate: "mother", args: ["tamari", "ani"] },
  {
    fact: "father(abraham, isaac)",
    predicate: "father",
    args: ["abraham", "isaac"],
  },
  { fact: "father(haran,lot)", predicate: "father", args: ["haran", "lot"] },
  { fact: "male(lot)", predicate: "male", args: ["lot"] },
  {
    fact: "likes(X,Pomegranates",
    predicate: "likes",
    args: ["X", "Pomegranates"],
  },
  {},
];

//// 1. factebi
const p = new Prolog();
p.facts = database_facts;
console.log(p.facts);

const colors = ["beige", "bisque", "azure", "ghostwhite"];
const dataset = document.getElementById("dataset");
const input = document.getElementById("input");
document.getElementById("add-data").addEventListener("click", () => {
  let value = input.value;
  p.add_entry(value);
  const article = document.createElement("article");

  article.classList.add("data-space");
  article.innerText = value;
  dataset.appendChild(article);
});
