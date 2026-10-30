# DealLogic source maintenance

For every DealLogic app change, update the current source in place. Delete superseded answers, prose, data and code instead of leaving old versions alongside replacements. Git history retains earlier iterations.

When questionnaire wording changes, update every dependent summary, risk rule, recommended action, export and saved-answer path. Keep one canonical list of current answer labels and make logic refer to stable positions or identifiers, rather than copies of the labels. Retain compatibility code only when it is needed to migrate existing user data, and keep that code narrowly scoped. Search the working tree for obsolete wording and run the relevant checks before committing.
