#!/bin/bash
cd /Users/dmitriikonovalov/claude/school-portal/scripts/reshak
while read path name; do
  [ -f raw/$name.json ] && continue
  python3 harvest.py "$path" "$name" > logs/$name.log 2>&1
done << LIST
/reshebniki/istoria/7/arsentev/index.html arsentev7
/reshebniki/istoria/7/udovskaya/index.html yudovskaya7
/reshebniki/geograph/7/korinskaya_new/index.html korinskaya7
/reshebniki/geograph/7/alexeev_nikolina/index.html alekseev7
/reshebniki/istoria/8/arsentev/index.html arsentev8
/reshebniki/istoria/8/udovskaya/index.html yudovskaya8
/reshebniki/geograph/8/alexeev_nikolina_new/index.html alekseev8
/reshebniki/istoria/9/arsentev_new/index.html arsentev9
/reshebniki/istoria/9/udovskaya/index.html yudovskaya9
/reshebniki/geograph/9/alexeev_nikolina/index.html alekseev9
/reshebniki/obshestvo/6/bogolubov/index.html bogolyubov6
/reshebniki/obshestvo/7/bogolubov/index.html bogolyubov7
/reshebniki/obshestvo/8/bogolubov/index.html bogolyubov8
/reshebniki/obshestvo/9/bogolubov/index.html bogolyubov9
/reshebniki/obshestvo/10/bogolubov/index.html bogolyubov10
/reshebniki/obshestvo/11/bogolubov/index.html bogolyubov11
/reshebniki/istoria/10/gorinov/index.html gorinov10
/reshebniki/istoria/11/zagladin/index.html zagladin11
/reshebniki/geograph/10/maksakovskiy10-11/index.html maksakovskiy10
LIST
echo ALLDONE >> logs/harvest_many2.log
