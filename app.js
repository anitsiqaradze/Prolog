const input_data = document.getElementById("input");
const dataset = document.getElementById("dataset");
const answer = document.getElementById("answer");

const query_section = document.getElementById("query");
const queries = document.getElementById("inputed-queries");

const input_query = document.getElementById("query_field");

// i store facts here in array
let database_facts = [
  { fact: "mother(tamari,ani)", predicate: "mother", args: ["tamari", "ani"] },
  {
    fact: "father(abraham, isaac)",
    predicate: "father",
    args: ["abraham", "isaac"],
  },
  { fact: "father(haran,lot)", predicate: "father", args: ["haran", "lot"] },
  { fact: "male(lot)", predicate: "male", args: ["lot"] },
  // { fact: "likes(X,Pomegranates" },
];

// add fact
/*  after clicking add fact button i pass query to split_input function
 which uses rex expression that returns first predicate and then following string
 in which i split by comma as they are atoms if they are > 1
 */
document.getElementById("add-data").addEventListener("click", () => {
  console.log("click");
  console.log(input_data);
  const fact = input_data.value.trim();
  const fact_data = split_input(fact);

  database_facts.push({
    fact: fact.substring(0, fact.length - 1),
    ...fact_data,
  });
  update_dataset_ui(fact);
  console.log("current facts ", database_facts);
});

// runs query to check if fact exists
document.getElementById("run-query").addEventListener("click", () => {
  const val = input_query.value;

  run_query(val);
});

function run_query(input) {
  if (input.includes("X")) {
    let input_data = split_input(input);
    let { predicate, args } = input_data;
    console.log(predicate, args);

    // check for generalization query
    /*  if argument contains X we look for one instanc of it then its true*/
    for (let i = 0; i < 2; i++) {
      if (args[i] == "X") {
        let atom_not_x_i = Number(!i);
        let ans = generalization(
          predicate,
          args[atom_not_x_i],
          atom_not_x_i,
          i
        );
        show_query_answer(input, ans);
        return;
      }
    }
  } else {
    query_prolog_facts(input);
  }
}

function generalization(predicate, args, var_index) {
  /* Generalization -  An existential
query P is a logical consequence of an instance of it, PO, for any substi
tution 6. The fact f ather(abraham, isaac) implies that there exists an X
such that f ather(abraham,X) is true, namely, X=isaac.
search for a fact that is an instance of the query.
*/
  let temp_atom;
  let match;

  for (entry of database_facts) {
    temp_atom = entry.args[var_index];
    console.log(temp_atom);
    console.log(entry);
    match = false;
    let j = 0;
    if (entry.predicate == predicate && entry.args.length == args.length) {
      entry.args[var_index] = "X";
      match = true;
      while (match && j < args.length) {
        match = entry.args[j] === args[j];
        console.log(entry.args[j], args[j]);
        j++;
      }
    }
    if (match) break;
  }

  if (match) return temp_atom;
  else return false;
}

function query_prolog_facts(q) {
  /// let query = q.substring(0, q.length - 1);
  let ans = database_facts.some((entry) => entry.fact === q);
  show_query_answer(q, ans);

  return ans;
}

function update_dataset_ui(fact) {
  dataset.innerHTML += `<h4>${fact}</h4>`;
  input_data.value = "";
}

function show_query_answer(q, ans) {
  answer.innerText = ` ${ans}`;
  queries.innerHTML += `<h4>${q} ${ans}</h4>`;
}

//argument match with patterns
// get predicate and following characters word before pathenthesis(anything else in parenthesis)ending character ? or .
function split_input(input) {
  let ending_character = input[input.length - 1];

  const match = input.match(new RegExp(`^(\\w+)\\((.*)\\)$`));

  console.log(match);

  let predicate = match[1].trim();
  let args = match[2].split(",").map((a) => a.trim());

  return {
    predicate: predicate,
    args: args,
  };
}

// single or more facts input match
// i check when two or more facts are passed as queries separated by comma

function analyze_query_structure(input) {
  const regex = /(\w+)\(([^)]*)\)/g;
  const match = input.match(regex);
  let f = true;
  console.log("match", match);
  return match;
  let i = 0;

  if (match) {
    while (f && i < match.length) {
      for (query of match) {
        f = false;
        for (entry of database_facts) {
          console.log("query ", query, "entry.fact ", entry.fact);
          if (query == entry.fact) {
            console.log("matched");
            f = true;
            break;
          }
        }
        i++;
      }
    }
  }

  //console.log("f", f);
}

//analyze_fact_query_structure("father(haran,X),male(X)");

//////////////////////////////////////////////////////
function run_query_1(q) {
  let has_variable = q.includes("X");
  let queries = analyze_query_structure(q);
  console.log("queries", queries, "has variable", has_variable);
  let results = [];

  // execute query

  if (has_variable) {
    let first_query = queries[0];
    let { predicate, args } = split_input(first_query);
    let var_arg_index;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "X") {
        var_arg_index = i;
      }
    }

    let answer = generalization(predicate, args, var_arg_index);

    console.log(query_prolog_facts(queries[1].replace("X", answer)));
  } else {
    for (query of queries) {
      console.log(
        "executed queries without variable",
        query,
        results.push(query_prolog_facts(query))
      );
    }
  }

  return results.every((r) => r === true);
  // check if query contains variable X to look for using generalization
  /* The fact f ather(abraham, isaac) implies that there exists an X
such that f ather(abraham,X) is true, namely, X=isaac. */
}

//run_query_1("father(haran,lot),male(X)");

run_query_1("father(haran,X),male(X)");

//**
// The simplest kind of statement is called a fact. Facts are a means of
// stating that a relation holds between objects.
//  father(abrahani,isaac).
//  Another name for a relation is a predicate. Names of individuals are known as atoms
//*
