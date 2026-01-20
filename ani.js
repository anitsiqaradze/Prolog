class Prolog {
  #factsList = [];

  set facts(f) {
    this.#factsList.push(...f);
  }
  get facts() {
    return this.#factsList;
  }

  add_entry(input) {
    // check if string contains :- sybol then try to parse as rule
    if (/\s*:-\s*/.test(input)) this.add_rule(input);
    // else think its fact and try to parse and add into database
    else this.addFact(input);

    // console.log(this.#factsList);
  }

  //* add fact / rule
  //////////////////////////////////////////////////////////
  addFact(factString) {
    const parsed = this.parseTerm(factString);
    if (parsed) {
      this.facts.push({
        type: "fact",
        entry: factString,
        predicate: parsed.predicate,
        args: parsed.args,
      });
      return true;
    }
    return false;
  }

  add_rule(rule_string) {
    // splits input between :- sybmol
    const match = rule_string.match(/^(.+):-(.+)$/);
    console.log(match);
    // attain rule definition string
    const rule_definition = this.parseQuery(match[2].trim());
    // rule head
    const rule_head_parts = this.parseTerm(match[1]);

    // save rule in array
    this.#factsList.push({
      type: "rule",
      entry: match[0].trim(),
      rule: match[1].trim(),
      rule_head: rule_head_parts.predicate,
      rule_args: rule_head_parts.args,
      rule_definition: rule_definition,
    });

    console.log(this.facts);
  }

  remove_entry(entry_text) {
    for (let i = 0; i < this.facts.length; i++) {
      if (this.facts[i].entry === entry_text) {
        this.facts.splice(i, 1);
      }
    }
  }

  /////////////////////////////////////////
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

  //////////////////2 to parse single term in fact, predicate, args

  // this method is used by add fact method
  parseTerm(term) {
    const match = term.match(new RegExp(`^(\\w+)\\((.*)\\)$`));

    console.log("parse term ", term, "match", match);

    let entry = match[0];
    let predicate = match[1].trim();
    let args = match[2].split(",").map((a) => a.trim());

    return {
      entry: entry,
      predicate: predicate,
      args: args,
    };
  }

  parseQuery(query) {
    // split input as predicate and arguments(string before bracket and string within it)
    const regex = /(\w+)\(([^)]*)\)/g;

    const goals = [];
    let match;

    // while regex find match format it as my object pattern and return it as an array that will be passed to solve method

    while ((match = regex.exec(query)) !== null) {
      console.log("match from query search parsing method ", match);
      goals.push({
        entry: match[0],
        predicate: match[1],
        args: match[2].split(",").map((arg) => arg.trim()),
      });
    }

    return goals;
  }
  //////////////////////////////////////////////////////////////////////

  solve(goals, substitution) {
    console.log("solve method called with ", goals);
    // if goals array is empty it means weve reached end of queries execution and only thing left is to analyze substitution object
    // it contains results of executed queries.
    // 1.substitutions for variables if query contained variables
    // 2. empty object if just fact was found in database and no variables were mentioned in query
    // 3. null if fact wasnt found.
    let current_goals = goals;
    // Base case: no more goals to solve

    if (goals.length === 0) {
      return [substitution];
    }

    // this checks if we have substitution variables from rule so it will try to look for specific atoms in database and not generalize them
    // for example when we have passed query which is rule in database i store definition of it with variables then this defition is added to
    // goals array to look for them in database but if i dont substitute variables values with ones passed in query unifyGoals method will generalize them

    // if (Object.keys(substitution).length !== 0) {
    //   current_goals = goals.map((g) => {
    //     return this.applySubstitution(g, substitution);
    //   });
    // }

    let [currentGoal, ...remainingGoals] = current_goals;
    const solutions = [];

    // Loop through DATABASE FACTS, not goals
    for (const entry of this.facts) {
      if (entry.type == "fact") {
        const list_goal = {
          entry: entry.entry,
          predicate: entry.predicate,
          args: entry.args,
        };

        // Try to unify current goal with this fact: finding variable bindings that make two logical terms identical.
        const newSubst = this.unifyGoals(currentGoal, list_goal, substitution);

        // if there were values for variables found we substitute them in all remaning goals
        if (newSubst !== null) {
          // Apply substitution to remaining goals
          const substitutedGoals = remainingGoals.map((g) =>
            this.applySubstitution(g, newSubst),
          );

          // after that i pass remaining goals to solve method with substitutions object
          //   // Recursively solve remaining goals
          const subSolutions = this.solve(substitutedGoals, newSubst);
          solutions.push(...subSolutions);
        }
      } else if (entry.type == "rule") {
        const list_rule = {
          entry: entry.entry,
          rule: entry.rule,
          rule_args: entry.rule_args,
          rule_head: entry.rule_head,
          rule_definition: entry.rule_definition,
        };

        console.log(list_rule);

        if (
          list_rule.rule_head ===
          currentGoal.entry.substring(0, list_rule.rule_head.length)
        ) {
          const newSubst = this.substitute_variables_of_rule(
            list_rule.rule_args,
            currentGoal.args,
          );
          const subst_goals = [...list_rule.rule_definition].map((g) =>
            this.applySubstitution(g, newSubst),
          );
          console.log("subst   goals", subst_goals);
          remainingGoals.unshift(...subst_goals);

          // console.log(remainingGoals);
          // if (newSubst !== null) {
          //   const substitutedGoals = remainingGoals.map((g) => {
          //     console.log(g);
          //     this.applySubstitution(g, newSubst);
          //   });

          //   const subSolutions = this.solve(substitutedGoals, newSubst);
          //   solutions.push(...subSolutions);
          // }

          //this.solve(remainingGoals, newSubst);
          const subSolutions = this.solve(remainingGoals, {});
          solutions.push(...subSolutions);
          console.log("solutions", solutions);
        }
      }
    }

    return solutions;
  }

  substitute_variables_of_rule(rule_args, goal_args) {
    const substitution = {};
    console.log("rule args ", rule_args, "goal args ", goal_args);

    for (let i = 0; i < rule_args.length; i++) {
      if (!this.isVariable(goal_args[i]))
        substitution[rule_args[i]] = goal_args[i];
    }

    console.log(substitution);
    return substitution;
  }

  unify(term1, term2, substitution = {}) {
    // Create a copy to avoid mutating the original
    const subst = { ...substitution };

    // Apply existing substitutions
    if (this.isVariable(term1) && subst[term1] !== undefined) {
      term1 = subst[term1];
    }
    if (this.isVariable(term2) && subst[term2] !== undefined) {
      term2 = subst[term2];
    }
    // if (this.isVariable(term1) && this.isVariable(term2) && term1 === term2) {
    //   subst[term1] = "_G";
    //

    // If both are the sameor second term is variable unification succeeds, its case where just actual values are compared or argument saved in databse is variable which means its universal and is true for any value
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
    console.log(goal, substitution);
    return {
      entry: goal.entry,
      predicate: goal.predicate,
      args: goal.args.map((arg) =>
        this.isVariable(arg) && substitution[arg] !== undefined
          ? substitution[arg]
          : arg,
      ),
    };
  }

  formatSolution(solutions) {
    console.log("solutions", solutions);
    let answer = "";
    if (solutions.length === 0) answer = false;
    else if (Object.keys(solutions[0]).length == 0) answer = true;
    // // else {
    // //   // Object.entries(solutions[0]).forEach(([key, value]) => {
    // //   //   console.log(key, value);
    // //   //   answer += `${key} - ${value} `;
    // //   // });
    else {
      for (let s of solutions) {
        Object.entries(s).forEach(([key, value]) => {
          console.log(key, value);
          answer += `${key} - ${value} `;
        });
      }
    }

    return answer;
  }
}

// search_for_fact(goal) {
//   for (let f of this.#factsList) {
//     if (f.fact === goal.fact) return true;
//   }
//   return false;
// }

///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////
let database_facts = [
  {
    type: "fact",
    entry: "mother(tamari,ani)",
    predicate: "mother",
    args: ["tamari", "ani"],
  },
  {
    type: "fact",
    entry: "father(abraham, isaac)",
    predicate: "father",
    args: ["abraham", "isaac"],
  },
  {
    type: "fact",
    entry: "father(haran,lot)",
    predicate: "father",
    args: ["haran", "lot"],
  },
  { type: "fact", entry: "male(lot)", predicate: "male", args: ["lot"] },
  {
    type: "fact",
    entry: "likes(X,pomegranates)",
    predicate: "likes",
    args: ["X", "pomegranates"],
  },
  {
    type: "rule",
    entry: "son(X,Y):-father(Y,X),male(X)",
    rule: "son(X,Y)",
    rule_head: "son",
    rule_args: ["X", "Y"],
    rule_definition: [
      {
        entry: "father(Y,X)",
        predicate: "father",
        args: ["Y", "X"],
      },
      {
        entry: "male(X)",
        predicate: "male",
        args: ["X"],
      },
    ],
  },
];

//// 1. factebi
const p = new Prolog();
p.facts = database_facts;
console.log(p.facts);

///////////////////////////////
//* dom elements
const dataset = document.getElementById("dataset");
const input = document.getElementById("input");
const query_input = document.getElementById("query-input");
const queries_container = document.getElementById("queries");

//////////////////////////////////
// add existing facts
//show already added facts
function show_data() {
  dataset.innerHTML = "";
  const data_space = document.querySelectorAll(".data-space");
  p.facts.forEach((entry) => {
    const article = document.createElement("article");
    article.classList.add("data-space");
    article.innerText = entry.entry;
    article.addEventListener("click", (e) => remove_data(e));
    dataset.appendChild(article);
  });

  return data_space;
}

const data_spaces = show_data();

// add listener to remove data space

function remove_data(data_node) {
  if (data_node) {
    const value = data_node.srcElement.innerText;
    p.remove_entry(value);

    show_data();
  }
}

////////////////////////////////////////
document.getElementById("add-data").addEventListener("click", () => {
  let value = input.value;
  p.add_entry(value);
  const article = document.createElement("article");

  article.classList.add("data-space");
  article.innerText = value.trim();
  dataset.appendChild(article);
  input.value = "";
});

document.getElementById("query").addEventListener("click", () => {
  const value = query_input.value.trim();

  const answer = p.formatSolution(p.query(value));
  //const answer = p.query(value);
  const article = document.createElement("article");
  article.classList.add("query-space");
  article.innerText = value + " answer [" + answer + "] ";

  const existingArticles = Array.from(
    document.querySelectorAll(".query-space"),
  );
  existingArticles.forEach((art) => {
    console.log(art);
    const currentTransform = art.style.transform || "translateY(0)";
    const currentY = parseFloat(currentTransform.match(/-?\d+/)[0]) || 0;
    console.log(currentTransform, currentY);
    art.style.transform = `translateY(${currentY}px)`;
    console.log(art.style.transform);
  });

  queries_container.append(article);
  query_input.value = "";

  // setTimeout(() => {
  //   const actualHeight = article.offsetHeight;
  //   existingArticles.forEach((art) => {
  //     const currentTransform = art.style.transform || "translateY(0)";
  //     const currentY = parseFloat(currentTransform.match(/-?\d+/) || [0])[0];
  //     art.style.transform = `translateY(${currentY}px)`;
  //     //+ (50 - actualHeight)
  //   });
  // }, 0);
});

//console.log(p.formatSolution(p.query("male(lot)")));

//console.log(p.query("father(X,Y),male(Y)"));
//p.add_entry("son(X,Y):-father(Y,X),male(Y)");
// console.log(p.formatSolution(p.query("likes(cat,dog)")));
// p.add_rule("son(X,Y):-father(Y,X),male(Y)");
// console.log(p.query("son(ani,bimi)"));

//console.log(p.query("son(lot,haran),father(abraham,X)"));
//console.log(p.query("likes(X, pomegranates), male(X)"));

//console.log(data_space);
// delete data space
//console.log(p.formatSolution(p.query("male(lot),father(abraham,isaac)")));
//p.formatSolution(p.query("father(haran,X),male(X)"));
//p.formatSolution(p.query("likes(ani,pomegranates)"));
p.formatSolution(p.query("son(X,Y)"));
