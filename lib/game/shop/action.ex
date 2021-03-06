defmodule Game.Shop.Action do
  @moduledoc """
  Shop actions
  """

  alias Game.Item
  alias Game.Items
  alias Game.Shop
  alias Metrics.ShopInstrumenter

  @doc """
  Buy an item from a shop
  """
  def buy(shop, item_name, save) do
    items = Enum.map(shop.shop_items, &(&1.item_id |> Items.item()))
    item = Enum.find(items, &Item.matches_lookup?(&1, item_name))

    case item do
      nil ->
        {:error, :item_not_found}

      item ->
        shop_item = Enum.find(shop.shop_items, &(&1.item_id == item.id))
        buy_item_if_enough(shop, shop_item, item, save)
    end
  end

  def buy_item_if_enough(_shop, %{quantity: 0}, item, _save),
    do: {:error, :not_enough_quantity, item}

  def buy_item_if_enough(shop, shop_item, item, save),
    do: maybe_buy_item(shop, shop_item, item, save)

  def change_quantity(shop_item = %{quantity: -1}), do: shop_item
  def change_quantity(shop_item), do: %{shop_item | quantity: shop_item.quantity - 1}

  def maybe_buy_item(shop, shop_item, item, save) do
    case save.currency - shop_item.price do
      currency when currency < 0 ->
        {:error, :not_enough_currency, item}

      currency ->
        ShopInstrumenter.buy(shop_item.price)
        instance = Data.Item.instantiate(item)
        save = %{save | currency: currency, items: [instance | save.items]}
        shop_item = change_quantity(shop_item)
        shop_items = [shop_item | shop.shop_items] |> Enum.uniq_by(& &1.id)
        {:ok, save, item, %{shop | shop_items: shop_items}}
    end
  end

  @doc """
  Sell an item to a shop
  """
  @spec sell(Shop.t(), String.t(), map) :: {:ok, map, Item.t(), Shop.t()}
  def sell(shop, item_name, save) do
    items = Enum.map(save.items, &Items.item/1)
    item = Enum.find(items, &Item.matches_lookup?(&1, item_name))

    case item do
      nil ->
        {:error, :item_not_found}

      item ->
        ShopInstrumenter.sell(item.cost)
        {_, items} = Item.remove(save.items, item)
        currency = save.currency + item.cost
        save = %{save | items: items, currency: currency}
        {:ok, save, item, shop}
    end
  end
end
