# Logging i početno čuvanje

Datum 2026-10-11. Odnosi se samo na lokalni sintetički prototip. [Osnova](SECURITY_PRIVACY_BASELINE.md), [verifikacija](VERIFICATION.md).

## Stvarna mapa podataka

| Podaci                                                                                           | Mesto                                   | Stvarno uklanjanje                                                                                                          |
| ------------------------------------------------------------------------------------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Profil/history, najviše 20 vidljivih poruka, matching, scoped grants, najviše 10 feedback stavki | RAM ConversationService                 | DELETE odmah; expiry/revoke na pristupu i periodično na 30s dok proces radi; restart gubi sadržaj                           |
| Session hash, invite ID, brojači, expiry/active hold                                             | Lokalni SQLite                          | DELETE odmah; istekao/opozvan pristup pri startup-u, pristupu i cleanup tick-u                                              |
| Invite hash i bounded use/revoke                                                                 | SQLite                                  | Nakon isteka, najviše sedam dana; default 24h; revoke ranije prekida pristup                                                |
| Globalni UTC dnevni token/cost zbir                                                              | SQLite                                  | Čuva tekući i prethodni UTC dan, cleanup uklanja starije; session deletion ne briše zbir                                    |
| Rezervacija hash/token bound/cost                                                                | SQLite                                  | Settle ili hold expiry nakon 35s; nepoznata potrošnja ostaje charged u zbiru                                                |
| Rate hash, minute/count                                                                          | SQLite                                  | Cleanup uklanja minute starije od prethodnog; nema IP-adrese                                                                |
| Minimalni operativni AI log                                                                      | SQLite logs                             | expires=upis+24h; cleanup startup/access i svakih 30s dok proces radi                                                       |
| Operator fajl sa invitation code-om                                                              | Ignorisani .local ili test .cache       | Ne automatski; operator briše kada nije potreban, create prepisuje isti fajl. Kod prestaje da daje pristup na expiry/revoke |
| Katalog/izvori                                                                                   | Verzionisani projektni JSON/izvorni PDF | Nisu sesijski podaci; nisu menjani ili brisani ovim korakom                                                                 |
| Pravi PDF upload                                                                                 | Nigde                                   | Nije prihvaćen; flag false i endpoint odbija                                                                                |

Cleanup je implementiran i testiran sa kontrolisanim satom. Scheduler zavisi od živog procesa i dostupne baze; ako laptop/proces ne radi, cleanup se izvršava pri sledećem pokretanju/pristupu. Ako baza nije dostupna, pristup fail-closed; timer pokušava ponovo. To nije garancija fizičkog brisanja tačno u sekundi. U toku zahteva može kratko postojati privremena kopija profila; ona ne može ponovo da upiše izbrisanu/opozvanu/isteklu sesiju. SQLite secure_delete=ON i DELETE journal smanjuju preostale podatke, ali ne dokazuju SSD/OS swap/backup secure erase. Backup nije implementiran; nema obećanja brisanja nepostojećeg ili budućeg dobavljačkog arhiva.

## Allowlist operativnog loga

Strict schema dozvoljava samo request UUID, pseudonimni sessionRef (prvih 16 hex znakova SHA-256 opaque tokena), tip interpret_message/explain_recommendations, model ID, durationMs, accounted tokens, usageKnown, nullable strukturisani input/cached/output usage, estimatedCostMicros, normalizovan errorCode i education-instructions-1. Pseudonim nije anonimnost. Kada mock nema usage, usageKnown=false i tokens predstavlja konzervativno računovodstvo, ne stvarnu naplatu. USD 0 je stvaran mock trošak.

Nema API ključeva, sirovih session/invite kodova, punih poruka/profila/dokumenata, imena, IP-a, lozinki, privatnih slobodnih error tekstova ili provider stack-a u ovom logu. Dodatni field odbija se testom. Rate key takođe je hashovan. Metadata nije slobodan modelski tekst. HTTP/framework development output može imati route/status/timing; ne uključivati body/headers debug niti external log collector. Nema slanja operativnih logova spoljnim servisima.

DELETE znači uklonjen pristup i profil, ne brisanje svih quota/log/invite zapisa; UI to izričito saopštava pre redemption-a. Fiktivni E2E invitation registri/slike u .cache i kontrolni unit fixture nisu korisnički sadržaj ili produkcione tajne; operator upravlja njihovim lokalnim razvojnim čuvanjem.
