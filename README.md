# Document Signer

Document Signer - это приложение, разработанное для подписи и хранения документов с использованием смарт-контракта на блокчейне Ethereum и интеграции с Dropbox для доступа к файлам.

## Смарт-контракт

Адрес смарт-контракта: `0x30Cb2a2bdc049183E1b5b016eEC18993cc4c05B8`

Исходный код смарт-контракта можно найти в этом репозитории: [https://github.com/tovkotov/document-signer](https://github.com/tovkotov/document-signer)

## Интеграция с Dropbox

Для интеграции с Dropbox, вам потребуется создать приложение Dropbox и получить `Client ID` и `Client Secret`. Эти данные должны быть добавлены в файл `.env.local` вашего проекта.

### Создание приложения Dropbox

1. Войдите в свою учетную запись Dropbox и перейдите на страницу [App Console](https://www.dropbox.com/developers/apps/create).
2. Выберите "Scoped access", затем "Full dropbox" или "App folder" в зависимости от ваших требований к доступу к файлам.
3. Введите имя приложения и нажмите "Create App" (Создать приложение).
4. Скопируйте `Client ID` и `Client Secret` со страницы настроек вашего приложения Dropbox.

### Конфигурация .env.local

Создайте файл `.env.local` в корне проекта с вашими переменными среды. Например:

* NEXT_PUBLIC_DROPBOX_CLIENT_ID=your_dropbox_client_id
* DROPBOX_CLIENT_SECRET=your_client_secret
* NEXT_PUBLIC_DROPBOX_CALLBACK_URL=http://localhost:3000


Замените `your_dropbox_client_id` и `your_client_secret` на ваш `Client ID` и `Client Secret` соответственно.

## Особенности приложения

- Подпись документов, используя ваш личный ключ Ethereum
- Хранение подписанных документов на блокчейне Ethereum
- Проверка статуса подписанных документов
- Интеграция с Dropbox для доступа к файлам

## Применение

Данное приложение может быть полезным для решения задач управления документами и подписания контрактов в реальной жизни. Оно использует технологию блокчейн для обеспечения безопасности, неизменности и проверяемости статуса подписанных и неподписанных документов. Вот несколько примеров использования приложения:

1. **Договоры и соглашения**: Приложение позволяет пользователям загружать и хранить договоры и соглашения в зашифрованном виде на блокчейн, обеспечивая безопасность и неизменность документов. Когда все стороны подписывают документ, его статус обновляется на блокчейн, что гарантирует надежность и прозрачность процесса.
2. **Юридические документы**: Приложение может быть использовано для управления и подписания юридических документов, таких как завещания, доверенности, договоры купли-продажи и другие. Благодаря использованию блокчейна, все стороны, связанные с документом, могут быть уверены в его подлинности и статусе.
3. **Финансовые документы**: Приложение может быть полезным для финансовых организаций, таких как банки и страховые компании, для управления и подписания финансовых документов, таких как кредитные соглашения и полисы страхования. Блокчейн обеспечивает надежность и прозрачность всех транзакций, связанных с документами.
4. **Документы для совместной работы**: Приложение может быть использовано для совместной работы над документами между различными сторонами. Участники могут подписывать документы, отслеживать изменения и следить за статусом подписей в реальном времени.

В целом, данное приложение является полезным инструментом для обеспечения безопасности, прозрачности и надежности процесса подписания и управления документами в различных сферах жизни и бизнеса.

## Установка и запуск

1. Клонируйте репозиторий:
``` git clone https://github.com/tovkotov/document-signer.git ```
2. Перейдите в папку проекта:
``` cd document-signer ```
3. Установите зависимости:
``` npm install ```
4. Создайте файл `.env.local` в корне проекта с вашими переменными среды, как указано в разделе "Конфигурация .env.local".
5. Запустите приложение:
``` npm run dev ```

## Использование

Откройте приложение в браузере и следуйте инструкциям на экране для подписи и хранения документов с использованием смарт-контракта и интеграции с Dropbox.

## Лицензия

Этот проект лицензирован под MIT License - см. LICENSE файл для подробностей.