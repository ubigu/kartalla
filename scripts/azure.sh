#!/bin/bash

# Azure Web App Settings Management Script
# Usage: ./azure_appsettings.sh <command> <environment> [settings]

RESOURCE_GROUP_PROD=vuorovaikutusalusta
RESOURCE_GROUP_TEST=vuorovaikutusalusta
WEBAPP_NAME_PROD=ubigu-vuorovaikutusalusta
WEBAPP_NAME_TEST=ubigu-test-vuorovaikutusalusta

show_usage() {
    echo "Usage: $0 <command> <environment> [settings]"
    echo ""
    echo "Commands:"
    echo "  list    - List all app settings"
    echo "  set     - Set app settings (provide KEY=value pairs)"
    echo "  delete  - Delete app settings (provide KEY names)"
    echo "  log     - Tail live logs from the web app"
    echo ""
    echo "Environments:"
    echo "  prod    - Production environment"
    echo "  test    - Test environment"
    echo ""
    echo "Examples:"
    echo "  $0 list prod"
    echo "  $0 list test"
    echo "  $0 set prod KEY1=value1 KEY2=value2"
    echo "  $0 set test API_URL=https://api.test.example.com"
    echo "  $0 delete prod KEY_TO_REMOVE"
    echo "  $0 delete test KEY1 KEY2"
    echo "  $0 log prod"
    echo "  $0 log test"
}

get_resource_group() {
    case $1 in
        prod) echo "$RESOURCE_GROUP_PROD" ;;
        test) echo "$RESOURCE_GROUP_TEST" ;;
        *) echo "" ;;
    esac
}

get_webapp_name() {
    case $1 in
        prod) echo "$WEBAPP_NAME_PROD" ;;
        test) echo "$WEBAPP_NAME_TEST" ;;
        *) echo "" ;;
    esac
}

list_settings() {
    local env=$1
    local resource_group=$(get_resource_group "$env")
    local webapp_name=$(get_webapp_name "$env")

    if [[ -z "$resource_group" || -z "$webapp_name" ]]; then
        echo "Error: Invalid environment '$env'"
        exit 1
    fi

    echo "Listing app settings for $env environment..."
    echo "Resource Group: $resource_group"
    echo "Web App: $webapp_name"
    echo ""

    az webapp config appsettings list \
        --resource-group "$resource_group" \
        --name "$webapp_name" \
        --output table
}

set_settings() {
    local env=$1
    shift
    local settings="$@"
    local resource_group=$(get_resource_group "$env")
    local webapp_name=$(get_webapp_name "$env")

    if [[ -z "$resource_group" || -z "$webapp_name" ]]; then
        echo "Error: Invalid environment '$env'"
        exit 1
    fi

    if [[ -z "$settings" ]]; then
        echo "Error: No settings provided"
        echo "Usage: $0 set <environment> KEY1=value1 KEY2=value2 ..."
        exit 1
    fi

    echo "Updating app settings for $env environment..."
    echo "Resource Group: $resource_group"
    echo "Web App: $webapp_name"
    echo "Settings: $settings"
    echo ""

    az webapp config appsettings set \
        --resource-group "$resource_group" \
        --name "$webapp_name" \
        --settings $settings
}

delete_settings() {
    local env=$1
    shift
    local settings="$@"
    local resource_group=$(get_resource_group "$env")
    local webapp_name=$(get_webapp_name "$env")

    if [[ -z "$resource_group" || -z "$webapp_name" ]]; then
        echo "Error: Invalid environment '$env'"
        exit 1
    fi

    if [[ -z "$settings" ]]; then
        echo "Error: No setting names provided"
        echo "Usage: $0 delete <environment> KEY1 KEY2 ..."
        exit 1
    fi

    echo "Deleting app settings for $env environment..."
    echo "Resource Group: $resource_group"
    echo "Web App: $webapp_name"
    echo "Settings to delete: $settings"
    echo ""

    az webapp config appsettings delete \
        --resource-group "$resource_group" \
        --name "$webapp_name" \
        --setting-names $settings
}

tail_logs() {
    local env=$1
    local resource_group=$(get_resource_group "$env")
    local webapp_name=$(get_webapp_name "$env")

    if [[ -z "$resource_group" || -z "$webapp_name" ]]; then
        echo "Error: Invalid environment '$env'"
        exit 1
    fi

    echo "Tailing logs for $env environment..."
    echo "Resource Group: $resource_group"
    echo "Web App: $webapp_name"
    echo "Press Ctrl+C to stop"
    echo ""

    az webapp log tail \
        --resource-group "$resource_group" \
        --name "$webapp_name"
}

# Main script
if [[ $# -lt 2 ]]; then
    show_usage
    exit 1
fi

COMMAND=$1
ENVIRONMENT=$2
shift 2

case $COMMAND in
    list)
        list_settings "$ENVIRONMENT"
        ;;
    set)
        set_settings "$ENVIRONMENT" "$@"
        ;;
    delete)
        delete_settings "$ENVIRONMENT" "$@"
        ;;
    log)
        tail_logs "$ENVIRONMENT"
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'"
        show_usage
        exit 1
        ;;
esac
